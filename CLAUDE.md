# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

A collection of self-contained browser games, each delivered as a **single HTML file** with all CSS and JavaScript inline. No build step, no dependencies, no server — open the file directly in a browser.

**Games:**
- `tictactoe.html` — 2-player / vs-computer Tic Tac Toe (DOM-based, no canvas)
- `shooter.html` — *Dead West*, a top-down western shooter (HTML5 Canvas)

## Running the games

Open any HTML file directly in a browser:

```
start shooter.html       # Windows
open shooter.html        # macOS
```

Or via the shell: `start "C:\Users\chris\OneDrive\Desktop\Claude\shooter.html"`

## Git workflow

**Commit and push after every meaningful unit of work** — a new feature, a bug fix, a visual change, a new file. Never leave work uncommitted at the end of a task. The goal is that the GitHub remote always reflects the current state of the project so work is never lost and any version can be restored.

```bash
git add <file>
git commit -m "short imperative summary"
git push
```

Commit message rules:
- Start with an imperative verb: `Add`, `Fix`, `Update`, `Remove`
- One concise subject line (50 chars or fewer when possible)
- No vague messages like "changes" or "update stuff"

Remote: `https://github.com/christianmonteniuss-stack/browser-games`

## shooter.html architecture

The entire game lives in one `<script>` block, divided by labeled sections (visible via `// ── SECTION ──` banners):

| Section | Responsibility |
|---|---|
| `SETUP` | Canvas sizing, window resize scaling |
| `PALETTE` | Single `COL` object — all colors live here |
| `LEVELS` | `LEVELS[]` array — wave/enemy definitions per level |
| `INPUT` | `keys{}` map + `mouse{}` object; `mouse.clicked` is set on `mousedown` and cleared at the top of each `loop()` tick |
| `PARTICLES` | `particles[]` array, `spawnDust()`, `spawnFlash()`, `tickParticles()`, `drawParticles()` |
| `FLOOR` | Pre-rendered to an offscreen `floorBuf` canvas at startup |
| `SPRITE HELPERS` | One `draw*()` function per entity type; all sprites are built from `ctx.fillRect` calls (no images). `R(x,y,w,h,color)` is the shorthand helper |
| `BULLET` | `Bullet` class — position, velocity, trail array, owner tag (`'player'`/`'enemy'`) |
| `ENEMY DEFS` | `EDEFS` object — stat block per enemy type (`outlaw`, `sharpshooter`, `desperado`, `boss`) |
| `ENEMY` | `Enemy` class — movement (straight-chase or keep-distance), contact damage, shooting logic for `sharpshooter` and `boss` |
| `PLAYER` | `Player` class — WASD/arrow movement, mouse aim angle, shoot on click with cooldown, invincibility frames after hit |
| `GAME STATE` | Module-level vars: `gstate`, `levelIdx`, `waveIdx`, `score`, `kills`, `shakeT`, etc. `startGame()` resets all of them |
| `HUD / SCREENS` | Pure draw functions — `drawHUD()`, `drawMenu()`, `drawGameOver()`, `drawWin()`, `drawLevelClear()` |
| `MAIN LOOP` | Single `loop(ts)` called via `requestAnimationFrame`; runs update then draw each frame. `dt` is capped at 50 ms to prevent spiral-of-death on tab blur |

**State machine:** `gstate` cycles through `'MENU' → 'PLAYING' → 'LEVEL_CLEAR' → 'PLAYING' → … → 'WIN'` (or `'GAME_OVER'`). All update and draw branches key off this string.

**Adding a new enemy type:** add a stat block to `EDEFS`, write a `draw*()` function in `SPRITE HELPERS`, add spawn entries to `LEVELS[]`.

**Adding a new level:** append an object to `LEVELS[]` — `{ name: 'LOCATION', waves: [[{type, n}, …], …] }`.

## tictactoe.html architecture

DOM-based (no canvas). Game state is a flat 9-element array `board[]`. `init()` resets it. `handleClick(i)` → `play(i)` → `checkResult()` drives the game. Computer AI in `bestMove()` uses win-detection then a priority order `[4,0,2,6,8,1,3,5,7]`.
