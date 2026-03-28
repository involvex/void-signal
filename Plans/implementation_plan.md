# Implementation Plan: Terminal ASCII RPG with Bun + TypeScript + xterm.js

**Date:** 2026-03-28
**Stack:** Bun runtime, TypeScript, @xterm/xterm-headless, direct ANSI rendering
**Status:** Ready for implementation

---

## Architecture Overview

A terminal-based ASCII RPG rendered entirely via ANSI escape codes to stdout, with xterm-headless for terminal state management and input parsing. The visual style replicates the HTML demos (parallax layers, colored ASCII art, tile-based world, animated elements) in a pure terminal context.

### Rendering Pipeline

```
Game State → ScreenBuffer (2D grid of {char, fg, bg}) → ANSI Escape Codes → stdout
                                                                    ↑
Input: stdin (raw mode) → Key Parser → Game Actions ←──────────────┘
```

### Key Design Decisions

1. **Direct ANSI rendering** instead of browser xterm.js — Bun runs in a terminal, not a browser. We write `\x1b[{row};{col}H\x1b[38;2;{r};{g};{b}m{char}` directly to stdout for each cell.
2. **@xterm/xterm-headless** for terminal buffer semantics, input parsing via `@xterm/parser`, and ANSI sequence generation via `@xterm/common`.
3. **Bun native stdin** in raw mode for real-time key capture (no node-pty needed).
4. **Tile-based world** with multiple scenes (town, forest, cave, ruins) drawn as ASCII character grids with per-cell color attributes.
5. **Turn-based combat** with real-time movement — the game loop ticks at ~20fps for animations but player actions resolve on keypress.

---

## File Structure

```
src/
  main.ts              — Entry point: terminal setup, raw mode, game loop, cleanup
  engine/
    game.ts            — Game engine: tick/update/render cycle, state machine
    screen-buffer.ts   — 2D cell grid with char + fg/bg color per cell
    renderer.ts        — Converts ScreenBuffer to ANSI escape codes, writes to stdout
    input.ts           — stdin raw mode, key event parsing, keybinding map
  world/
    world.ts           — World manager: scene registry, transitions, current scene
    scene.ts           — Scene class: tile data, entities, collision grid
    maps.ts            — Map data definitions (town, forest, cave, ruins) as string arrays
  entities/
    entity.ts          — Base entity: position, glyph, color, name
    player.ts          — Player: stats, inventory, movement, collision
    npc.ts             — NPCs: dialogue triggers, merchants
    enemy.ts           — Enemies: AI, combat stats, loot tables
    item.ts            — Items: weapons, potions, keys — ground pickup + inventory
  systems/
    combat.ts          — Turn-based combat: initiative, attacks, damage calc, loot
    inventory.ts       — Inventory management: add/remove/use items
    dialogue.ts        — Dialogue tree system: branching text with choices
    stats.ts           — RPG stats: HP, ATK, DEF, XP, level-up
    messages.ts        — Message log: timestamped colored messages for the UI panel
  ui/
    hud.ts             — HUD overlay: HP bar, stats, minimap, message log, inventory
    menus.ts           — Menu system: pause menu, inventory screen, dialogue screen
index.ts               — Re-exports main.ts for `bun run index.ts`
```

---

## Module Specifications

### 1. `src/main.ts` — Entry Point

- Enable stdin raw mode via `process.stdin.setRawMode(true)`
- Create GameEngine instance
- Start game loop: `setInterval(() => engine.tick(), 50)` (20fps)
- Handle SIGINT (`process.on('SIGINT', ...)`) to restore terminal and exit cleanly
- Write `\x1b[?1049h` (alternate screen buffer) on start, `\x1b[?1049l` on exit
- Hide cursor: `\x1b[?25l`, show on exit: `\x1b[?25h`
- Clear screen on start: `\x1b[2J\x1b[H`

### 2. `src/engine/screen-buffer.ts` — Screen Buffer

```typescript
interface Cell {
	char: string
	fg: [number, number, number] // RGB
	bg: [number, number, number]
}

class ScreenBuffer {
	width: number
	height: number
	cells: Cell[][]
	dirty: boolean[][]

	constructor(width: number, height: number)
	clear(fg?: RGB, bg?: RGB): void
	set(x: number, y: number, char: string, fg: RGB, bg?: RGB): void
	write(x: number, y: number, text: string, fg: RGB, bg?: RGB): void
	fillRect(x, y, w, h, char, fg, bg): void
	drawBox(x, y, w, h, fg, bg): void // ╔═╗ ║ ╚═╝ borders
	drawBar(x, y, w, current, max, fillChar, fg, bg): void // HP/MP bars
	isDirty(x, y): boolean
	markClean(): void
	isInBounds(x, y): boolean
}
```

### 3. `src/engine/renderer.ts` — ANSI Renderer

- Builds ANSI string from ScreenBuffer by diffing against previous frame
- Full-frame clear on scene transitions, dirty-cell optimization during gameplay
- Color output: `\x1b[38;2;{r};{g};{b}m` (foreground), `\x1b[48;2;{r};{g};{b}m` (background)
- Cursor positioning: `\x1b[{row+1};{col+1}H`
- Reset: `\x1b[0m`
- Writes to `process.stdout.write()` in a single buffered write per frame

```typescript
class Renderer {
	buffer: ScreenBuffer
	prevBuffer: ScreenBuffer | null

	render(): void // Diff and write ANSI to stdout
	forceRedraw(): void // Full frame (scene transitions)
	cleanup(): void // Reset terminal state
}
```

### 4. `src/engine/input.ts` — Input Handler

- Reads from `process.stdin` in raw mode
- Parses key events: arrow keys (`\x1b[A/B/C/D`), WASD, Enter, Escape, Tab, space, letter keys
- Emits typed events: `KeyAction { key: string, ctrl: boolean, shift: boolean }`
- Supports keybinding registration: `on('w', () => player.move(0, -1))`
- Handles special sequences: `\x1b` prefix parsing for arrows/function keys

```typescript
interface KeyAction {
	key: string // 'w', 'arrowup', 'enter', 'escape', etc.
	ctrl: boolean
	shift: boolean
	raw: string
}

class InputManager {
	private listeners: Map<string, Set<(action: KeyAction) => void>>
	start(): void
	stop(): void
	on(key: string, handler: (action: KeyAction) => void): void
	off(key: string, handler: (action: KeyAction) => void): void
}
```

### 5. `src/engine/game.ts` — Game Engine

```typescript
class GameEngine {
	screen: ScreenBuffer
	renderer: Renderer
	input: InputManager
	hud: HUD
	world: WorldManager
	player: Player
	messages: MessageLog
	state: 'title' | 'playing' | 'combat' | 'dialogue' | 'inventory' | 'paused'
	tickCount: number

	constructor()
	tick(): void // Called every 50ms
	update(): void // Game logic
	render(): void // Draw everything to ScreenBuffer
	changeState(newState): void
	startGame(): void
	quit(): void
}
```

### 6. `src/world/scene.ts` — Scene

```typescript
class Scene {
	name: string
	width: number
	height: number
	tiles: string[][] // Character grid (the visual map)
	tileColors: RGB[][][] // [y][x] → [fg, bg]
	collision: boolean[][] // Solid tiles
	entities: Entity[]
	npcs: NPC[]
	enemies: Enemy[]
	items: GroundItem[]
	exits: SceneExit[] // { x, y, targetScene, targetX, targetY }
	ambientColor: RGB // Scene tint
	description: string // "look" command text

	isSolid(x: number, y: number): boolean
	getEntityAt(x: number, y: number): Entity | null
	removeEntity(entity: Entity): void
}
```

### 7. `src/world/maps.ts` — Map Data

Maps defined as string arrays with a legend:

- `#` = wall (solid), `.` = floor, `~` = water, `T` = tree, `+` = door
- `@` = player start, `N` = NPC, `E` = enemy spawn, `!` = item
- `╔═╗║╚╝` = decorative borders, `▓▒░` = terrain texture

Each map has associated color data (fg/bg per tile type).

**Maps to implement:**

1. **Town** (40×20): buildings, merchant NPC, quest board, exits north/south
2. **Forest** (60×25): trees, paths, enemy encounters, hidden items
3. **Cave** (50×20): dark corridors, torches, cave enemies, treasure chest
4. **Ruins** (55×22): stone architecture, boss area, lore inscriptions

### 8. `src/entities/player.ts` — Player

```typescript
class Player extends Entity {
	stats: Stats // HP, maxHp, atk, def, xp, level, gold
	inventory: Item[]
	equipment: {weapon: Item | null; armor: Item | null}

	move(dx: number, dy: number, scene: Scene): boolean // Returns if moved
	pickup(item: GroundItem): void
	useItem(item: Item): void
	attack(enemy: Enemy): CombatResult
}
```

### 9. `src/systems/combat.ts` — Combat System

Turn-based: player acts → enemies act → resolve → check death.

- Player options: Attack, Use Item, Flee
- Damage formula: `max(1, attacker.atk - defender.def + random(-2, 2))`
- XP/loot on enemy death
- Combat state renders over the game view with combat UI panel

### 10. `src/systems/dialogue.ts` — Dialogue Trees

```typescript
interface DialogueNode {
	text: string
	choices: {text: string; next: string; action?: () => void}[]
}

class DialogueSystem {
	trees: Map<string, Map<string, DialogueNode>>
	currentTree: string | null
	currentNode: string | null

	start(treeId: string, nodeId: string): void
	selectChoice(index: number): void
	render(buffer: ScreenBuffer, hudArea: Rect): void
}
```

### 11. `src/ui/hud.ts` — HUD Overlay

Renders on top of or alongside the game viewport:

- **Top bar**: Game title, HP bar (`[████████░░] 47/80`), MP bar, XP bar, Gold
- **Right sidebar** (20 cols): Location name, danger level, inventory summary
- **Bottom bar**: Message log (last 3-5 messages, colored by type)
- **Minimap** (optional): Small ASCII overview of current scene

```
╔══════════════════════════════════╦══════════════════╗
║ HP [████████░░] 47/80  Gold: 83 ║ VOID RUINS B3    ║
║ MP [████░░░░░░] 22/60  Lvl: 5   ║ Danger: ■■■■□    ║
╠══════════════════════════════════╬══════════════════╣
║                                  ║ Signal Blade +12 ║
║    (game viewport 70×20)         ║ Void Cloak DEF 8 ║
║                                  ║ Ether Flask ×3   ║
║                                  ║                  ║
╠══════════════════════════════════╬══════════════════╣
║ > A CAVE SENTINEL stirs...       ║ [WASD] Move      ║
║   You ready your Signal Blade.   ║ [I]nventory      ║
╚══════════════════════════════════╩══════════════════╝
```

### 12. `src/ui/menus.ts` — Menu System

Full-screen overlay menus for:

- **Title screen**: ASCII art logo, "Press ENTER to start"
- **Inventory screen**: Item list with stats, equip/use/drop actions
- **Pause menu**: Resume, Save (future), Quit
- **Combat menu**: Attack, Item, Flee options with arrow-key navigation
- **Dialogue screen**: NPC portrait (ASCII), text, numbered choices

---

## Visual Style (Ported from HTML Demos)

### From `ascii-bg-demo.html`:

- **Color palette**: Green terminal aesthetic (`#0f0`, `#0a3`, `#0f4`), amber warnings (`#fa0`), red danger (`#f44`), blue system (`#46f`)
- **UI panels**: Dark semi-transparent backgrounds with subtle borders
- **Message styles**: `.dim` (#555), `.highlight` (#0fa), `.warn` (#fa0), `.danger` (#f44), `.system` (#46f italic)
- **Stat bars**: Character-based bars with gradient feel via `█░` characters
- **Typewriter effect**: Characters appear one at a time for dialogue

### From `ascii-2d-scene.html`:

- **Parallax layers**: Background decoration at different scroll speeds (implemented as static scene decoration in top-down view)
- **Tile variety**: `▓▒░█` for ground textures, `╔═╗║╚╝` for architecture
- **Character sprites**: Multi-character glyphs (`─╫─`, `│`, `╱╲` for player)
- **Animated elements**: Torches cycling `▲△✦▲`, dust motes, flickering lights
- **Atmospheric colors**: Deep purples (#010008 → #0e0430), contrasting greens for player (#00ff99)
- **Vignette effect**: Simulated by darkening edges of the viewport

---

## Terminal Compatibility

### ANSI sequences used:

| Sequence                      | Purpose                           |
| ----------------------------- | --------------------------------- |
| `\x1b[?1049h` / `\x1b[?1049l` | Alternate screen buffer on/off    |
| `\x1b[?25l` / `\x1b[?25h`     | Hide/show cursor                  |
| `\x1b[2J`                     | Clear screen                      |
| `\x1b[H`                      | Cursor to home                    |
| `\x1b[{row};{col}H`           | Cursor position (1-indexed)       |
| `\x1b[38;2;{r};{g};{b}m`      | Foreground RGB color              |
| `\x1b[48;2;{r};{g};{b}m`      | Background RGB color              |
| `\x1b[0m`                     | Reset all attributes              |
| `\x1b[1m` / `\x1b[2m`         | Bold / Dim                        |
| `\x7`                         | Terminal bell (combat hit, alert) |

### Terminal size detection:

- `process.stdout.columns` / `process.stdout.rows`
- Listen for `SIGWINCH` to handle resize
- Recalculate HUD layout on resize
- Minimum size: 90×28 (game viewport + HUD)

---

## Dependencies

```json
{
	"dependencies": {
		"@xterm/headless": "^0.10.0",
		"@xterm/common": "^0.10.0"
	},
	"devDependencies": {
		"@types/bun": "latest",
		"typescript": "^5"
	}
}
```

Note: `@xterm/headless` provides the `Terminal` class for headless buffer management. `@xterm/common` provides shared types and ANSI sequence generation utilities. If these prove insufficient or problematic, we fall back to direct ANSI string building (which is straightforward for our use case).

---

## Implementation Order (12 Steps)

### Step 1: Project Setup

- `bun install @xterm/headless @xterm/common`
- Update `package.json` scripts: `"start": "bun run src/main.ts"`, `"dev": "bun --watch run src/main.ts"`
- Create directory structure under `src/`

### Step 2: Screen Buffer + ANSI Renderer

- Implement `ScreenBuffer` class (cell grid, set/write/clear/fillRect/drawBox)
- Implement `Renderer` class (ANSI string building, stdout writing, dirty-cell diffing)
- Test: draw a colored box and text to terminal

### Step 3: Input Manager

- Implement `InputManager` (stdin raw mode, key parsing, arrow/WASD/Enter/Escape)
- Test: print key names to screen as you press them

### Step 4: Game Engine Core

- Implement `GameEngine` (tick loop, state machine, cleanup on exit)
- Wire ScreenBuffer + Renderer + InputManager together
- Test: title screen that responds to Enter key

### Step 5: World/Scene System

- Implement `Scene` class (tiles, collision, entity slots, exits)
- Implement `WorldManager` (scene registry, transitions, current scene)
- Create town map data (40×20)

### Step 6: Player + Movement

- Implement `Player` class (position, glyph, color, stats, movement with collision)
- WASD movement in town scene
- Scene exit detection (walk to edge → transition)

### Step 7: HUD

- Implement `HUD` class (top bar with HP/MP/XP, right sidebar, bottom message log)
- Render HUD around game viewport
- Connect to player stats and message log

### Step 8: NPCs + Dialogue

- Implement `NPC` class (position, glyph, dialogue tree trigger)
- Implement `DialogueSystem` (branching text, numbered choices)
- Add town merchant NPC with buy/sell dialogue

### Step 9: Enemies + Combat

- Implement `Enemy` class (stats, AI, loot table)
- Implement `CombatSystem` (turn-based: attack/item/flee, damage calc, XP/loot)
- Add forest enemies (glitch wolf) and cave enemies (cave sentinel)

### Step 10: Items + Inventory

- Implement `Item` system (weapons, armor, potions, keys)
- Implement `Inventory` (add/remove/use, equipment slots)
- Ground items in scenes, pickup on walk-over
- Full inventory screen (Tab key)

### Step 11: Additional Maps + Scene Transitions

- Create forest map (60×25), cave map (50×20), ruins map (55×22)
- Wire scene transitions (doors, exits)
- Enemy spawns per scene, item placements

### Step 12: Polish + Effects

- Animated torches in cave/ruins (cycling chars)
- Message log colors (combat = red, system = blue, loot = amber)
- Title screen ASCII art
- Terminal bell on combat hits
- Scene ambient colors (forest = green tint, cave = dark, ruins = purple)
- Minimap in sidebar

---

## Testing Strategy

No formal test framework — verify by running `bun run src/main.ts` and playing through:

1. Title screen appears, press Enter to start
2. Move player with WASD in town, collision with walls works
3. Talk to NPC (walk into them), dialogue appears, choices work
4. Walk north to forest, scene transition works
5. Encounter enemy, combat menu appears, attack/flee works
6. Pick up items, check inventory screen (Tab)
7. Enter cave, fight sentinel, collect loot
8. Reach ruins, visual style changes (purple tint)
9. Resize terminal, HUD reflows
10. Ctrl+C cleanly exits (restores terminal state)

---

## Known Risks & Mitigations

| Risk                                            | Mitigation                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------- |
| `@xterm/headless` API may not expose raw buffer | Fall back to pure ANSI string building — the renderer doesn't strictly need xterm |
| Terminal color support varies                   | Test with `\x1b[38;2` (24-bit), fallback to 256-color `\x1b[38;5` if needed       |
| stdin raw mode on Windows                       | Bun supports it; test on Windows explicitly since the dev environment is win32    |
| Flicker on render                               | Use dirty-cell diffing (only write changed cells) + cursor positioning            |
| Terminal too small                              | Show resize message if < 90×28                                                    |

---

## Sources

- HTML demos: `Plans/ascii-bg-demo.html` (color palette, UI layout, message styles), `Plans/ascii-2d-scene.html` (tile rendering, sprite system, parallax, animation)
- Prior research: `Plans/findings.md` (framework decision), `Plans/Idea.md` (game concept)
- xterm-headless: https://github.com/xtermjs/xterm.js/tree/master/headless
- Bun stdin API: https://bun.sh/docs/api/stdin
