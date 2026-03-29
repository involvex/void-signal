# Void Signal - Terminal RPG Engine

Void Signal is a high-performance terminal-based ASCII RPG engine built with **Bun** and **TypeScript**. It utilizes direct **ANSI escape codes** for 24-bit RGB rendering and features a sophisticated double-buffered display system.

## Project Overview

- **Core Loop**: Driven by `GameEngine` at a target of 20 FPS (50ms ticks).
- **Rendering**: Uses a `ScreenBuffer` for differential rendering, minimizing terminal flicker by only sending changed cells to stdout.
- **Color**: Supports full 24-bit RGB via `[r, g, b]` tuples.
- **State Machine**: Transitions between `title`, `playing`, `combat`, `dialogue`, `inventory`, and `paused`.
- **World System**: Map-based world with interconnected scenes, procedural terrain, and dynamic entity management.

## Project Structure

```text
src/
├── main.ts            # Entry point: terminal setup, game loop start
├── engine/
│   ├── game.ts        # Core engine: tick/update/render cycle, state machine
│   ├── input.ts       # stdin raw mode, key event parsing
│   ├── renderer.ts    # Converts ScreenBuffer to ANSI escape codes
│   └── screen-buffer.ts # 2D cell grid (char + fg/bg color)
├── entities/
│   ├── entity.ts      # Base class for all world objects
│   ├── player.ts      # Player: stats, inventory, equipment
│   ├── enemy.ts       # Enemies: combat stats, loot tables
│   ├── npc.ts         # NPCs: dialogue triggers, merchant flags
│   └── item.ts        # Item definitions and factories
├── systems/
│   ├── combat.ts      # Turn-based combat logic
│   ├── dialogue.ts    # Branching dialogue tree system
│   ├── messages.ts    # HUD message log system
│   ├── art-loader.ts  # ASCII art library loader
│   └── art-manager.ts # Dynamic asset management
├── world/
│   ├── world.ts       # World manager: scene registry and transitions
│   ├── scene.ts       # Scene: tile data, collision, exits
│   └── maps.ts        # Map definitions (Town, Forest, Cave, Ruins)
├── ui/
│   ├── hud.ts         # HUD overlay: HP/MP/XP bars, sidebars
│   └── menus.ts       # Full-screen menus: title, inventory, combat
└── types.ts           # Shared interfaces and types
```

## Building and Running

| Command             | Description                               |
| ------------------- | ----------------------------------------- |
| `bun install`       | Install dependencies (primarily devTools) |
| `bun run start`     | Launch the game                           |
| `bun run dev`       | Launch in watch mode (auto-restart)       |
| `bun run build`     | Production build to `dist/`               |
| `bun run typecheck` | Run TypeScript type checking              |
| `bun run lint`      | ESLint code quality check                 |
| `bun run format`    | Prettier formatting                       |
| `bun run prebuild`  | Full verification (format + lint + types) |

## Development Guidelines

### Rendering & UI
- **ScreenBuffer**: All drawing goes through `ScreenBuffer`. Never write ANSI escape codes directly — the `Renderer` class handles buffer-to-terminal conversion. Use `screen.set()`, `screen.write()`, `screen.drawBox()`, `screen.fillRect()`, `screen.drawBar()`.
- **HUD Layout**: Use `HUD.calculateLayout(cols, rows)` to handle terminal resizing dynamically.
- **ASCII Art**: Assets are located in `asciiart/asciiart/`. Use `ArtManager.getRandomArt(category)` to fetch dynamic visuals for combat/NPCs.
- **Colors**: Use the `RGB` type `[number, number, number]` for all foreground and background colors.

### Input Handling
- **InputManager**: All keyboard input flows through `InputManager`. It parses raw stdin into `KeyAction` objects.
- **State-Specific**: Input is delegated by `GameEngine` based on `this.state` (`title`, `playing`, `combat`, `dialogue`, `inventory`, `paused`).

### Coding Standards
- **Naming**: 
  - **Classes/Interfaces/Types**: PascalCase (`GameEngine`, `ScreenBuffer`).
  - **Methods/Variables**: camelCase (`moveSelection`, `tickCount`).
  - **Constants**: UPPER_SNAKE_CASE (`DEFAULT_FG`, `TORCH_CHARS`).
  - **Union states**: Lowercase snake_case string literals (`'player_turn'`, `'victory'`).
  - **Files**: kebab-case (`screen-buffer.ts`).
- **TypeScript**: 
  - Strict mode is enabled. Use `import type` for type annotations.
  - `noUncheckedIndexedAccess`: Always guard array access with `?.` or explicit checks.
  - Explicit return types on public methods.
  - Avoid `any`. Prefix unused variables with `_`.
- **Formatting**: Prettier with `@involvex/prettier-config` (Tabs, No Semicolons, Single Quotes).
- **Error Handling**: Graceful fallbacks instead of throwing. Silent return on out-of-bounds drawing.

## Game Systems

- **Entity Inheritance**: All objects extend `Entity` (`x`, `y`, `glyph`, `color`, `name`). Subclasses: `Player`, `Enemy`, `NPC`.
- **Combat**: Turn-based (Player Turn -> Enemy Turn). Supports Attack, Item, and Flee.
- **Dialogue**: Node-based branching trees. Selection via number keys `1-9`.
- **Movement**: WASD or Arrow keys. Continuous movement supported via key-repeat detection in `update()`.
- **Items**: Defined in `src/entities/item.ts`. Pickable via collision.
