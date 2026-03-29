## Tooling commands
- `bun run start` — run the game (alias for `bun run src/main.ts`)
- `bun run dev` — run with file watching/autorestart
- `bun run build` — Bun bundle entry point into `dist/`
- `bun run typecheck` — `tsc --noEmit`
- `bun run lint` / `bun run lint:fix` — ESLint over `src/`
- `bun run format` — Prettier run across the repo
- `bun run prebuild` — format, lint:fix, and typecheck in a single hook

There is no automated test suite; verification is currently manual (run the game via `bun run start` and play through relevant flows).

## What to know before you code
- **Engine + rendering** live under `src/engine/`; `GameEngine` manages a 20 fps tick loop while `ScreenBuffer` feeds `Renderer` to emit ANSI-visible tiles. Input is normalized through `InputManager` before hitting the state machine.
- **Entities, systems, UI, and world** are separated by directory (entities hold `Entity`, `Player`, `Enemy`, `NPC`, `item` data; systems cover combat/dialogue/messages; `ui/` owns HUD/menus; `world/` wires scenes, maps, and transitions). High-level entry is `src/main.ts`, with `index.ts` re-exporting for Bun’s module entry.
- **Item creation** and map construction rely on factory helpers (`createTown()`, `createForest()`, `getItem(id)`, `createItem(id)`), ensuring the same logic is reused across scenes.

## Key conventions
- **Code style:** Bun + TypeScript (strict + ES modules), tabs for indentation, single quotes, no semicolons, trailing commas handled via Prettier. Avoid comments unless explicitly requested.
- **TypeScript rules:** Guard array/object access (`noUncheckedIndexedAccess`), prefer explicit return types, and never rely on implicit `any` (use `unknown` + narrowing). Prefix unused variables or parameters with `_`.
- **Naming:** PascalCase for classes/types, camelCase for members, UPPER_SNAKE_CASE for module-level constants, kebab-case filenames.
- **Infrastructure:** All drawing flows through `ScreenBuffer`; do not emit raw ANSI. Input is normalized via `InputManager`; state transitions happen inside `GameEngine`. Errors return early (no throws for invalid coordinates), and logging should only use `console.warn` / `console.error`.
- **Tooling:** Before merging work, always run `bun run typecheck` and `bun run lint`.
