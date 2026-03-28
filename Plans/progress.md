# Progress Log — Terminal RPG Framework Decision

**Session start:** 2026-03-28
**Task:** Framework decision (Rust vs Node/TS) for terminal ASCII RPG with multiplayer

---

## Session 1 — 2026-03-28

### Actions taken

- [x] Read planning-with-files SKILL.md
- [x] Read uploaded ideation document (Perplexity research on terminal RPG concepts)
- [x] Analyzed ruscii Rust codebase (Cargo.toml, src/app.rs, src/drawing.rs, src/keyboard.rs, examples/)
- [x] Analyzed xterm.js Node/TS codebase (demo/server/server.ts, demo/client/client.ts, README.md)
- [x] Reviewed React + xterm prototype (from conversation history)
- [x] Created task_plan.md
- [x] Created findings.md (full analysis + decision matrix)
- [x] Created progress.md (this file)

### Findings summary

- Node/TS wins 6 of 10 criteria for this specific project type
- Key deciding factors: inkjs integration, xterm.js native fit, existing prototype, dev velocity
- Rust remains the right choice for native-binary or high-frequency competitive games
- Hybrid path is viable: Node server + optional Rust native client later

### Decision made

**→ Node/TypeScript + xterm.js + WebSocket**

### Next steps (for next session)

- [ ] Set up Node/TS project scaffold (express, ws, better-sqlite3, inkjs)
- [ ] Port the React + xterm prototype to connect to a real WebSocket game server
- [ ] Write first ink story file (town → dungeon → boss)
- [ ] Design the WebSocket message protocol (command in, render frame out)
- [ ] Implement first game room with 2-player co-op session

---

## Known risks

| Risk                                                 | Mitigation                                              |
| ---------------------------------------------------- | ------------------------------------------------------- |
| Node performance for tick-rate-sensitive multiplayer | Use turn-based or slow real-time; not competitive arena |
| inkjs learning curve                                 | Official docs are good; examples exist                  |
| xterm render protocol (escape codes vs JSON frames)  | Start with raw ANSI escape codes; simpler               |
| Scope creep on multiplayer                           | Start async (ghost messages) before real-time co-op     |
