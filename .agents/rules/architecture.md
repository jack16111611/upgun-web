# UpGun Web Clone — Core Architecture & AI Rules

## 1. Tech Stack (Strict)
- **Language:** TypeScript (strict mode) across all packages.
- **Monorepo Layout:**
  - `packages/shared`: Pure TypeScript game constants, types, Event-Hook Card engine, and shared `@dimforge/rapier3d-compat` physics simulation. Zero React or Three.js rendering imports allowed here.
  - `packages/server`: Authoritative multiplayer server using `colyseus` (v0.18+) and `@colyseus/schema`.
  - `packages/client`: Browser client using `three`, `@react-three/fiber`, `@react-three/drei`, `zustand`, and `@colyseus/sdk`.

## 2. Code Modularity & Anti-Spaghetti Guardrails
- **350-Line Cap:** No single TypeScript file may exceed 350 lines. Split large systems into focused modules.
- **No Hardcoded Card Checks:** Never write `if (player.hasCard("explosive_bullets"))` inside weapon or movement code. All upgrade cards MUST register event hooks (`onFire`, `onProjectileSpawn`, `onProjectileTick`, `onHit`, `onDash`, `onTakeDamage`, `onDeath`) inside `packages/shared/src/cards/`.
- **Recursion Safety:** Any projectile or grenade that spawns child projectiles (e.g., Grenadeception, Cluster) MUST increment `recursionDepth` and stop spawning when `recursionDepth >= MAX_RECURSION_DEPTH` (default: 3).

## 3. Cross-Device First (Desktop, Mobile, Gamepad)
- All player actions MUST flow through a unified `InputFrame` struct (`moveX`, `moveZ`, `yaw`, `pitch`, `jump`, `dash`, `fire`, `grenade`, `reload`).
- Client UI must support both Pointer Lock (desktop) and responsive touch controls (iOS/Android landscape) without overlapping HUD elements.

## 4. Multi-Agent Model Roles
- **Gemini 4 Neon:** Primary architect, netcode, physics, and core gameplay systems.
- **Gemini 4 Hydrogen:** Parallel worker subagents (in `branch` worktree mode) for self-contained upgrade cards, arena maps, and UI components.
- **Gemini 4 Argon:** Security audits, authoritative validation checks, and physics edge-case reviews.