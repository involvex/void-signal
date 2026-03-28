# AGENTS.md — ascii-rpg

Terminal-based ASCII RPG with colored tile rendering, turn-based combat, NPCs, and branching dialogue. Built with Bun + TypeScript.

## Build & Run Commands

```bash
bun run start          # Run the game (equivalent to: bun run src/main.ts)
bun run dev            # Run with file watching
bun run build          # Production bundle to dist/ via Bun bundler
bun run typecheck      # TypeScript type checking (tsc --noEmit)
bun run lint           # Lint src/ with ESLint
bun run lint:fix       # Lint with auto-fix
bun run format         # Format all files with Prettier
bun run prebuild       # Runs format + lint:fix + typecheck (pre-build hook)
```

No test framework is configured. Verify changes by running `bun run start` and playing through the game. See `Plans/implementation_plan.md` for a 10-step manual verification checklist.

Always run `bun run typecheck` and `bun run lint` before considering a task complete.

## Project Structure

```
src/
  engine/        Core loop, rendering, input (game.ts, renderer.ts, input.ts, screen-buffer.ts)
  entities/      Game objects (entity.ts base → player.ts, enemy.ts, npc.ts, item.ts)
  systems/       Game logic (combat.ts, dialogue.ts, messages.ts)
  ui/            HUD and menu rendering (hud.ts, menus.ts)
  world/         Scene/map management (scene.ts, maps.ts, world.ts)
  types.ts       Shared interfaces and types
  main.ts        Binary entry point
index.ts         Module entry point (re-exports from src/main.ts)
```

## Code Style

### General

- **Runtime:** Bun runs TypeScript natively — no compilation step needed.
- **Module system:** ES modules (`"type": "module"` in package.json). Import paths include `.ts` extension: `import {Entity} from './entity.ts'`.
- **Type-only imports:** Use `import type` when importing only for type annotations. With `verbatimModuleSyntax` enabled in tsconfig, this is required.
- **Indentation:** Tabs, not spaces.
- **Quotes:** Single quotes for strings.
- **Semicolons:** None — rely on ASI (Automatic Semicolon Insertion).
- **Trailing commas:** Prettier handles this (via `@involvex/prettier-config`).
- **No comments** unless explicitly requested by the user.

### TypeScript

- **Strict mode** is enabled. All `strict` family options are on.
- **`noUncheckedIndexedAccess`** is on — always guard array/object access with `?.` or explicit checks: `const cell = this.cells[y]?.[x]`.
- **Explicit return types** on public methods and getters: `get totalAtk(): number`, `clear(fg?: RGB): void`.
- **Avoid `any`** — it triggers a lint warning. Prefer specific types or `unknown`.
- **Non-null assertions** (`!`) are allowed but use sparingly.
- **Unused variables/parameters:** Prefix with `_` to suppress warnings (`argsIgnorePattern: '^_'`).

### Naming Conventions

- **Classes/Interfaces/Types:** PascalCase — `GameEngine`, `ScreenBuffer`, `Player`, `ItemDef`, `CombatState`.
- **Methods/variables/parameters:** camelCase — `moveSelection`, `drawBar`, `tickCount`.
- **Module-level constants:** UPPER_SNAKE_CASE — `DEFAULT_FG`, `TORCH_CHARS`.
- **Union types for state:** Lowercase snake_case string literals — `'player_turn'`, `'victory'`, `'playing'`.
- **File names:** kebab-case — `screen-buffer.ts`, `game.ts`.

### Patterns

- **Entity inheritance:** All game objects extend `Entity` (base class with `x`, `y`, `glyph`, `color`, `name`). Subclasses: `Player`, `Enemy`, `NPC`.
- **Rendering:** All drawing goes through `ScreenBuffer`. Never write ANSI escape codes directly — the `Renderer` class handles buffer-to-terminal conversion. Use `screen.set()`, `screen.write()`, `screen.drawBox()`, `screen.fillRect()`, `screen.drawBar()`.
- **Input:** All keyboard input flows through `InputManager`. It parses raw stdin into `KeyAction` objects.
- **Game state machine:** `GameEngine` manages states (`title`, `playing`, `combat`, `dialogue`, `inventory`, `paused`) with a 20fps tick loop via `setInterval`.
- **Factory functions:** Maps use factory functions (e.g., `createTown()`, `createForest()`) that return `Scene` instances.
- **Item definitions:** Defined as a record in `src/entities/item.ts`. Use `getItem(id)` and `createItem(id)` to access.

### Error Handling

- Graceful fallbacks — return early on invalid state rather than throwing.
- Bounds checking before array access, especially with `noUncheckedIndexedAccess`.
- Use `console.warn` / `console.error` only (no `console.log` — lint warning).
- Invalid coordinates: silently return from drawing functions: `if (x < 0 || x >= this.width) return`.

### ESLint Rules (key overrides)

| Rule                                       | Level | Notes                                           |
| ------------------------------------------ | ----- | ----------------------------------------------- |
| `@typescript-eslint/no-unused-vars`        | warn  | Ignore `_`-prefixed args/vars                   |
| `@typescript-eslint/no-explicit-any`       | warn  | Prefer specific types                           |
| `@typescript-eslint/no-non-null-assertion` | off   | Allowed                                         |
| `@typescript-eslint/no-empty-function`     | off   | Allowed (constructors, callbacks)               |
| `prefer-const`                             | error | Always use `const` unless reassignment needed   |
| `no-console`                               | warn  | Only `console.warn` and `console.error` allowed |

## Key Dependencies

- `@xterm/headless` — Terminal emulation (runtime)
- `typescript-eslint` — ESLint TypeScript integration (dev)
- `prettier` + `@involvex/prettier-config` — Formatting (dev)
- `@types/bun` — Bun type definitions (dev)
