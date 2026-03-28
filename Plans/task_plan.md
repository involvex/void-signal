# Task Plan: Framework Decision — Rust vs Node/TypeScript

# Terminal ASCII RPG with Multiplayer

**Goal:** Make a well-reasoned, documented framework choice for building a terminal-based ASCII RPG game with multiplayer elements. Not just pick a winner — understand the tradeoffs deeply enough to commit confidently.

**Status:** `in_progress`
**Date:** 2026-03-28

---

## Context Summary

From prior research and prototype work:

- Game concept: narrative tactical roguelite, terminal UI, ink-style story, optional async multiplayer
- Frontend explored: `@xterm/xterm` + React (browser-based terminal emulator)
- Backend option A: **Rust** — `ruscii` crate as reference (already in scope)
- Backend option B: **Node/TypeScript** — xterm.js server demo, express-ws, node-pty
- Multiplayer model: session-based, co-op raids, async world state, or real-time arena

---

## Phases

### Phase 1 — Define Evaluation Criteria

**Status:** `complete`

Dimensions to evaluate:

1. Developer velocity (hobby project — finishing matters more than perfection)
2. Rendering pipeline (TUI raw terminal vs browser xterm.js)
3. Multiplayer architecture fit (WebSocket, TCP, shared state)
4. Ecosystem for game needs (ink integration, ASCII art, animation)
5. Deployment target (native binary, server, browser hybrid)
6. Long-term maintainability and community

---

### Phase 2 — Rust Deep Dive

**Status:** `complete`
See: `findings.md` → section RUST

Key reference: `ruscii` crate (already provided in context)

- Crossterm-based rendering, key press/release events, FPS loop
- `device_query` for raw key input (X11 on Linux)
- Canvas/Pencil abstraction for drawing

---

### Phase 3 — Node/TypeScript Deep Dive

**Status:** `complete`
See: `findings.md` → section NODE

Key reference: xterm.js source + demo server (already provided in context)

- `@xterm/xterm`: browser terminal emulator, WebSocket attach addon
- `node-pty`: real PTY spawning for true terminal emulation
- `express-ws`: WebSocket server for multiplayer
- React + xterm prototype: already validated feel

---

### Phase 4 — Multiplayer Architecture Analysis

**Status:** `complete`
See: `findings.md` → section MULTIPLAYER

---

### Phase 5 — Decision Matrix + Recommendation

**Status:** `complete`
See: `findings.md` → section DECISION

---

### Phase 6 — MVP Architecture Sketch

**Status:** `complete`
See: `findings.md` → section MVP

---

## Final Decision

**→ Node/TypeScript + xterm.js + WebSocket**

for the **game server and multiplayer layer**, with **React + @xterm/xterm** as the client shell.

Optional: Rust for a standalone native client mode later (no blocker either way).

---

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
| —     | —       | —          |

---

## Files Created

- `task_plan.md` (this file)
- `findings.md` (detailed research)
- `progress.md` (session log)
