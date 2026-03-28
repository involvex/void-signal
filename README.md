# Void Signal

A terminal-based ASCII RPG with colored tile rendering, turn-based combat, NPCs, and branching dialogue. Built with [Bun](https://bun.sh) + TypeScript.

## Features

- Tile-based world rendered in real-time with 24-bit RGB color via ANSI escape codes
- Turn-based combat with Attack, Use Item, and Flee options
- 4 interconnected maps: Town, Forest, Cave, and Void Ruins
- Branching dialogue system with 4 unique NPCs (Merchant, Elder, Guard, Sage)
- Equipment system (weapons, armor) with stat bonuses
- 8 item types including weapons, potions, keys, and quest items
- Level-up system with scaling XP requirements and stat growth
- Loot drops from enemies with weighted random chances
- Animated torch effects across dark environments
- Procedural terrain generation in Forest, Cave, and Ruins maps
- Differential rendering for flicker-free 20fps display
- Terminal resize handling with automatic HUD reflow

## Prerequisites

- [Bun](https://bun.sh/docs/install) v1.0 or later
- A terminal that supports 24-bit RGB color (most modern terminals)

## Installation

```bash
git clone https://github.com/involvex/void-signal.git
cd void-signal
bun install
```

## Usage

```bash
bun run start          # Run the game
bun run dev            # Run with file watching (auto-restart on changes)
```

## Controls

### Overworld

| Key                                 | Action                           |
| ----------------------------------- | -------------------------------- |
| `W` / `A` / `S` / `D` or Arrow Keys | Move player                      |
| `E`                                 | Interact with adjacent NPC/enemy |
| `Tab`                               | Open inventory                   |
| `Escape`                            | Open pause menu                  |
| `Ctrl+C`                            | Quit game                        |

### Combat

| Key                     | Action                                    |
| ----------------------- | ----------------------------------------- |
| `W` / `S` or Arrow Keys | Navigate actions (Attack, Use Item, Flee) |
| `Enter`                 | Confirm action                            |
| `Enter` / `Escape`      | Dismiss result screen                     |

### Dialogue

| Key       | Action                 |
| --------- | ---------------------- |
| `1` - `9` | Select dialogue choice |
| `Escape`  | Close dialogue         |

### Inventory

| Key                     | Action                     |
| ----------------------- | -------------------------- |
| `W` / `S` or Arrow Keys | Navigate items             |
| `Enter`                 | Use or equip selected item |
| `Escape` / `Tab`        | Close inventory            |

## Game World

The world consists of 4 maps connected by exits at the edges:

```
Void Ruins (Boss area, no north exit)
    ^
    | (north)
  Cave (dark caverns, Cave Sentinel, Bat Swarm)
    ^
    | (north)
Forest (procedural trees, Glitch Wolves, Signal Spider)
    ^
    | (north)
  Town (NPCs, shops, starting area)
```

### Enemies

| Enemy         | Location | HP  | ATK | DEF | XP  | Gold |
| ------------- | -------- | --- | --- | --- | --- | ---- |
| Glitch Wolf   | Forest   | 40  | 10  | 3   | 30  | 10   |
| Signal Spider | Forest   | 55  | 13  | 5   | 45  | 15   |
| Bat Swarm     | Cave     | 30  | 8   | 2   | 20  | 8    |
| Cave Sentinel | Cave     | 80  | 15  | 7   | 60  | 20   |
| Echo Wraith   | Ruins    | 60  | 14  | 6   | 50  | 18   |
| Void Warden   | Ruins    | 150 | 20  | 10  | 200 | 50   |

### Items

| Item          | Type   | Effect                   |
| ------------- | ------ | ------------------------ |
| Rusty Sword   | Weapon | ATK +4                   |
| Signal Blade  | Weapon | ATK +12                  |
| Leather Armor | Armor  | DEF +4                   |
| Void Cloak    | Armor  | DEF +8                   |
| Health Potion | Potion | Heals 30 HP              |
| Ether Flask   | Potion | Heals 20 MP              |
| Town Key      | Key    | Opens northern gate      |
| Echo Core     | Quest  | Pulsing void energy core |

## Project Structure

```
src/
  main.ts              Entry point: terminal setup, game loop, cleanup
  engine/
    game.ts            Game engine: tick/update/render cycle, state machine
    screen-buffer.ts   2D cell grid with char + fg/bg color per cell
    renderer.ts        Converts ScreenBuffer to ANSI escape codes
    input.ts           stdin raw mode, key event parsing
  entities/
    entity.ts          Base entity class (position, glyph, color, name)
    player.ts          Player: stats, inventory, equipment, movement
    enemy.ts           Enemies: combat stats, loot tables
    npc.ts             NPCs: dialogue triggers, merchant flag
    item.ts            Item definitions and factory functions
  systems/
    combat.ts          Turn-based combat: attack, item, flee
    dialogue.ts        Branching dialogue tree system
    messages.ts        Colored message log for the HUD
  world/
    world.ts           World manager: scene registry and transitions
    scene.ts           Scene: tile data, entities, collision, exits
    maps.ts            Map definitions: town, forest, cave, ruins
  ui/
    hud.ts             HUD overlay: HP/MP/XP bars, sidebar, message log
    menus.ts           Full-screen menus: title, inventory, pause, combat
  types.ts             Shared interfaces and types
index.ts               Module entry point (re-exports src/main.ts)
```

## Development

| Command             | Description                               |
| ------------------- | ----------------------------------------- |
| `bun run start`     | Run the game                              |
| `bun run dev`       | Run with file watching                    |
| `bun run build`     | Production bundle to `dist/`              |
| `bun run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `bun run lint`      | Lint `src/` with ESLint                   |
| `bun run lint:fix`  | Lint with auto-fix                        |
| `bun run format`    | Format all files with Prettier            |
| `bun run prebuild`  | Runs format + lint:fix + typecheck        |

## Tech Stack

- **Runtime:** Bun (native TypeScript execution, no compilation step)
- **Language:** TypeScript (strict mode, ES modules)
- **Terminal:** `@xterm/headless` for buffer management and input parsing
- **Rendering:** Direct ANSI escape codes (24-bit RGB, cursor positioning)
- **Linting:** ESLint with `typescript-eslint`
- **Formatting:** Prettier with `@involvex/prettier-config`
