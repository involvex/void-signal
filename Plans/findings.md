# Findings: Rust vs Node/TypeScript for Terminal ASCII RPG

---

## CRITERIA — What matters for this project

| #   | Criterion              | Why it matters                                        |
| --- | ---------------------- | ----------------------------------------------------- |
| 1   | **Dev velocity**       | Hobby project. Months not years. Finishing > perfect. |
| 2   | **Rendering pipeline** | Raw terminal vs browser terminal — very different DX  |
| 3   | **Multiplayer fit**    | WebSocket, TCP, shared mutable state                  |
| 4   | **Ecosystem**          | ink integration, ASCII art, animation libs            |
| 5   | **Deployment**         | Binary? Browser? Server? Docker?                      |
| 6   | **Maintainability**    | Can you return to it after 3 months off?              |

---

## RUST — Analysis

### Strengths

#### Performance & Control

- Near-zero overhead rendering loop; can hit 60+ FPS in TUI easily
- Full control over memory, threads, timing
- `ruscii` gives you: `App::run()` game loop, `Pencil` drawing API, key press/release events (not just key-down)
- Key press+release distinction is rare in TUI libs — essential for real-time games (AsciiArena proves this)

#### Real-time multiplayer server

- Tokio async runtime: handles thousands of concurrent WebSocket or TCP connections efficiently
- `tokio-tungstenite` for WebSocket, `tonic` for gRPC if needed
- No GC pauses — latency is predictable
- Strong type system catches race conditions at compile time

#### Standalone binary

- Single binary, no runtime dependency
- Ships everywhere: Linux, Windows, macOS
- Players just download and run — no Node installed, no npm

#### Libraries relevant to this game

- `ruscii` — game loop, rendering, input (already in context)
- `crossterm` — lower level terminal control (used by ruscii)
- `serde` + `serde_json` — game state serialization
- `tokio` — async multiplayer server
- `sqlx` / `rusqlite` — persistent world state
- `rand` — roguelite generation

### Weaknesses

#### Learning curve

- Rust ownership/borrow checker is genuinely hard for solo hobby dev
- Async Rust (`async/await` + Tokio) has its own complexity layer
- Compile times are slow — edit/test loop slower than TS
- Error messages are good but the learning investment is real

#### ink integration (narrative layer)

- ink is designed for Unity / JS environments
- No official Rust ink runtime
- `bladeink` (community Rust port) exists but is not mature
- You'd likely have to implement your own dialogue/branching system or transpile ink to JSON and parse it manually

#### xterm.js / Browser client

- If you want a browser client (React + @xterm/xterm), you need a Rust WebSocket server
- That's fine — but the Rust server cannot directly use xterm.js (browser-only)
- You'd be building both a native TUI client (ruscii) AND a web bridge separately

#### Community / examples

- TUI game examples in Rust exist (AsciiArena, terminal-tetris, etc.) but are sparse
- Most Rust TUI projects are developer tools, not games
- Less Stack Overflow help for "Rust terminal RPG combat"

---

## NODE/TYPESCRIPT — Analysis

### Strengths

#### Dev velocity

- You already have a working React + xterm prototype (from your conversation history)
- TypeScript: fast edit/test loop, hot reload, no compile wait
- npm ecosystem: everything exists as a package
- Easier to iterate on game feel, commands, story branching

#### ink integration (narrative layer)

- **inkjs** is the official TypeScript/JS ink runtime
- Inkle (ink creators) maintain it
- You write `.ink` files, compile to JSON, run with inkjs in Node
- Direct, mature, no workarounds
- This is a significant advantage for a narrative RPG

#### xterm.js ecosystem

- You are literally looking at the xterm.js source code right now
- `@xterm/xterm`: client terminal emulator (browser)
- `node-pty`: real PTY on the server side
- `@xterm/addon-attach`: WebSocket bridge between server PTY and browser xterm
- `express-ws`: WebSocket server
- The demo server (`demo/server/server.ts`) in the provided context is almost exactly the architecture you need

#### Multiplayer

- WebSocket with `ws` or `express-ws` — trivial to set up
- `socket.io` if you want rooms, reconnection, broadcast — all built in
- Shared game state is just a JS object — easy to serialize to JSON
- Redis for pub/sub if you scale later

#### Deployment

- Node server: runs anywhere (VPS, Railway, Render, Fly.io)
- Docker image trivially small
- Browser client needs only a web server — can even host on GitHub Pages
- Players need only a browser — zero install friction

#### Community

- Massive TS/JS community
- xterm.js is used by VS Code, Replit, Gitpod — battle-tested
- Lots of MUD/roguelite experiments in JS/TS on GitHub

### Weaknesses

#### Performance

- GC pauses exist — not a dealbreaker for turn-based RPG
- For real-time multiplayer with fast tick rate (60Hz game loop), Node can struggle
- Single-threaded by default — worker threads possible but awkward
- For your game (turn-based or slow real-time), this is **not a real problem**

#### Native terminal client

- If you want players to play in their actual terminal (not browser), Node is awkward
- `node-pty` can do it but it's not a clean game loop
- For a browser-first game, not relevant

#### Long-running process stability

- Node can have memory leaks in long-running servers
- Rust would be more robust for a 24/7 multiplayer game server
- Mitigated with process managers (PM2, systemd)

---

## MULTIPLAYER — Architecture Analysis

### What your game needs (from the concept)

Option A: **Async multiplayer** — players leave messages, traps, echoes in the world. Asynchronous. Lower complexity.
Option B: **Session co-op** — 2-4 players in a dungeon together. Real-time or turn-based.
Option C: **Arena / deathmatch** — real-time, competitive. Highest complexity.

### Rust multiplayer fit

| Mode              | Rust fit     | Notes                                       |
| ----------------- | ------------ | ------------------------------------------- |
| Async world state | ✅ Excellent | Tokio + SQLite/Postgres, low resource usage |
| Session co-op     | ✅ Good      | Tokio rooms, shared Arc<Mutex<GameRoom>>    |
| Real-time arena   | ✅ Best      | Low latency, no GC, deterministic loop      |

### Node multiplayer fit

| Mode              | Node fit     | Notes                                                        |
| ----------------- | ------------ | ------------------------------------------------------------ |
| Async world state | ✅ Excellent | Express + socket.io + Redis/SQLite                           |
| Session co-op     | ✅ Good      | socket.io rooms, JSON state sync                             |
| Real-time arena   | ⚠️ Workable  | GC pauses, single-thread limits; fine for small player count |

**Conclusion:** For your described game (narrative RPG, optional co-op, async world events), Node is fully capable. Rust's multiplayer advantage only matters for high-frequency competitive games.

---

## DECISION — Framework Matrix

| Criterion                     | Rust                                 | Node/TS                          | Winner   |
| ----------------------------- | ------------------------------------ | -------------------------------- | -------- |
| Dev velocity (hobby)          | ⚠️ Slow compile, steep curve         | ✅ Fast iteration, known tooling | **Node** |
| Rendering (browser)           | ⚠️ Needs extra bridge                | ✅ xterm.js native fit           | **Node** |
| Rendering (native terminal)   | ✅ ruscii, crossterm                 | ⚠️ Awkward with node-pty         | **Rust** |
| ink story integration         | ❌ No mature runtime                 | ✅ inkjs official                | **Node** |
| Multiplayer (narrative/co-op) | ✅ Excellent                         | ✅ Excellent                     | **Tie**  |
| Multiplayer (real-time arena) | ✅ Best                              | ⚠️ Workable                      | **Rust** |
| Deployment simplicity         | ✅ Single binary                     | ✅ Docker/VPS easy               | **Tie**  |
| Player access (no install)    | ❌ Download required                 | ✅ Browser URL                   | **Node** |
| Ecosystem for game needs      | ⚠️ Sparse                            | ✅ Rich                          | **Node** |
| Hobby sustainability          | ⚠️ Risk of burnout on borrow checker | ✅ More forgiving                | **Node** |

**Score: Node/TS wins 6, Rust wins 2, Tie 2**

---

## RECOMMENDATION

### Primary choice: **Node/TypeScript + xterm.js + WebSocket**

#### Stack

```
Client (Browser):
  React + @xterm/xterm
  ↕ WebSocket
Server (Node):
  Express + express-ws
  Game loop in Node (setInterval / tickloop)
  inkjs for narrative
  SQLite (better-sqlite3) for world state
  socket.io for multiplayer rooms

Optional native client (later):
  Rust + ruscii → connect to same WebSocket server
```

#### Why this works

1. You already have the React + xterm prototype — it works, you know the feel
2. inkjs gives you the full narrative power of ink without workarounds
3. The xterm.js demo server in your context is literally the starting point
4. Multiplayer via socket.io rooms is ~100 lines of code for co-op sessions
5. Deploy to any VPS or Railway — players need only a browser
6. You can write game logic in TypeScript at hobby speed, not fight the borrow checker

#### When to choose Rust instead

- You want a **standalone native binary** players download and run in their real terminal
- You're targeting a **high-concurrency competitive real-time game** (Arena mode)
- You want to learn Rust and are willing to spend extra months on the framework itself
- You don't need ink integration (writing your own story system)

#### Hybrid path (optional)

Start with Node/TS. If you later want:

- A native client: write a small Rust client that connects to the same WebSocket server
- Better server performance: port the game loop server to Rust, keep the xterm.js client

The protocol (WebSocket + JSON game events) is language-agnostic. You're not locked in.

---

## MVP — Architecture Sketch

### Server (Node/TS)

```typescript
// server.ts
import Database from 'better-sqlite3'
import {WebSocketServer} from 'ws'
import express from 'express'
import {Story} from 'inkjs'

const db = new Database('world.db')
const rooms = new Map<string, GameRoom>()

// Game room: holds shared state for 1-4 players
interface GameRoom {
	id: string
	players: Map<string, Player>
	worldState: WorldState
	story: Story // inkjs narrative
	tick: NodeJS.Timeout
}

// WebSocket message protocol
type GameMessage =
	| {type: 'command'; payload: string} // player sends command
	| {type: 'render'; payload: TerminalFrame} // server sends render update
	| {type: 'join'; payload: {name: string}}
	| {type: 'chat'; payload: string}
```

### Client (React + xterm)

```typescript
// GameTerminal.tsx
// Mount xterm.js, connect WebSocket, pipe render frames to terminal
// Input goes to server as command messages
// Server sends back terminal escape sequences or JSON render frames
```

### Story Layer (ink)

```ink
// world.ink
VAR location = "town"
VAR faction_rep = 0

-> town_start

=== town_start ===
The signal is weak here. Traders speak in fragments.
* [Go north to the forest] -> forest_edge
* [Talk to the merchant] -> merchant_talk
* [Check your stats] -> stats_check
```

### Data Model

```typescript
interface WorldState {
	locations: Record<string, Location>
	playerTraces: PlayerTrace[] // async ghost messages from other players
	factionStates: Record<string, number>
	dungeonSeed: number
}

interface PlayerTrace {
	playerId: string
	locationId: string
	message: string
	timestamp: number
	type: 'message' | 'trap' | 'echo'
}
```

---

## SOURCES & REFERENCES

- ruscii crate (Rust, in context): game loop, Pencil API, key events
- xterm.js demo server (Node/TS, in context): WebSocket PTY, express-ws pattern
- inkjs: https://github.com/y-lohse/inkjs — official ink runtime for JS/TS
- AsciiArena (Rust reference): https://github.com/lemunozm/asciiarena
- node-pty: https://github.com/microsoft/node-pty
- better-sqlite3: sync SQLite for Node — simplest persistence option
- socket.io: rooms, reconnection, broadcast — simplest multiplayer
