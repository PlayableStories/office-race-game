# Office Chair Racing Championship

A 2D endless survival office-chair racing game. Pump your speed by alternating arrow keys, climb the corporate ladder from Junior Developer to CEO, and try not to get fired.

Built with [Phaser 4](https://phaser.io), [Vite 6](https://vitejs.dev), and TypeScript.

## How to play

- **Pump speed** — alternate `←` / `→` (or `A` / `D`). Same key twice in a row does nothing; you must alternate.
- **Change lane** — `↑` / `↓` to swerve between the three carpet lanes.
- Speed naturally decays — stop pumping and you slow to a halt.
- **Stand still for half a second and you're fired** for slacking off.

## Mechanics

### Career ladder

| Rank | Title           |
|------|-----------------|
| 0    | Junior Developer |
| 1    | Developer        |
| 2    | Senior Developer |
| 3    | Tech Lead        |
| 4    | VP Engineering   |
| 5    | CEO              |

Each time you **overtake** an NPC you get promoted, and your salary is multiplied by a random factor in the rank's promote range (roughly 2.0× – 10.0×). Each time an NPC **passes you** you get demoted, and salary takes a cut (roughly 0.1× – 0.5×). Get passed while at Junior Developer and you're fired.

### NPC behaviour

- **Pre-overtake — Pace mode.** When the five NPCs reveal themselves a few seconds into the race, each starts a 5-second ramp toward `player.currentSpeed − gap`, where the gap depends on tier:
  - Slow tier: 200 px/s slower than you
  - Medium tier: 100 px/s slower
  - Fast tier: 50 px/s slower

  They never run *slower* than their own initial cruise speed, so passing them requires sustained effort, not coasting.

- **The moment you pass an NPC — Chase mode.** Their floating name flips to `AI`, the sprite flashes red ↔ yellow, and they ramp over 5 seconds toward `player.currentSpeed + 50`. Slow trickle of pressure — they'll catch you if you let your speed drop, but you can stay ahead by pumping hard.

- **Pursuit NPC.** If you're demoted all the way back to Junior Developer (without being fired yet), a fresh red-labelled `AI` NPC spawns off-screen behind you, already running at `player.currentSpeed + 50`.

### Getting fired

Two ways:

1. **Demoted past Junior Developer** — banner: **YOU'RE FIRED!**
2. **Stand still for 0.5 s after the race begins** — banner: **SLACKING OFF!**

In both cases your final salary at the moment of firing is shown on the game-over screen, with the option to retry or go back to the main menu.

## Setup

```sh
npm install
npm run dev
```

Then open <http://localhost:8080>.

### Commands

| Command               | Description                                              |
|-----------------------|----------------------------------------------------------|
| `npm install`         | Install dependencies                                     |
| `npm run dev`         | Start dev server with hot reload at :8080                |
| `npm run build`       | Build production bundle into `dist/`                     |
| `npm run dev-nolog`   | Dev server without the template's anonymous telemetry    |
| `npm run build-nolog` | Production build without the template's anonymous telemetry |

> `log.js` makes a single anonymous ping to gryzor.co (owned by Phaser Studio) reporting which template was used, dev or prod, and which Phaser version. Use the `-nolog` variants or delete `log.js` to opt out.

Node 18+ is required (Vite 6 + Phaser 4).

## Tech stack

- [**Phaser 4**](https://github.com/phaserjs/phaser) — game engine
- [**Vite 6**](https://vitejs.dev) — bundler and dev server
- **TypeScript 5.7** (strict mode)

All in-game graphics are generated programmatically in `src/game/scenes/Preloader.ts` — no external art assets.

## Project structure

```
src/
  main.ts                    bootstrap
  game/
    main.ts                  Phaser config + scene list
    config/
      characters.ts          6 procedurally-coloured racers
      ranks.ts               6 ranks + promote/demote multiplier ranges
    objects/
      Racer.ts               base — raceDistance, speed, halt, lane
      Player.ts              pump mechanic + lane change
      NPC.ts                 tier oscillation + pace + chase modes
    scenes/
      Boot.ts                straight to Preloader
      Preloader.ts           programmatic texture generation
      MainMenu.ts            title + ladder preview + controls legend
      Game.ts                main scene — orchestrates everything
      GameOver.ts            fired / slacking branches
    systems/
      RaceManager.ts         position tracking + overtake events
    ui/
      HUD.ts                 rank / salary / position
      RankPopup.ts           promotion / demotion popup
```

For implementation notes and architectural decisions, see [`GAME_BUILD_LOG.md`](GAME_BUILD_LOG.md).

## Credits

Built on the [`phaserjs/template-vite-ts`](https://github.com/phaserjs/template-vite-ts) starter. See [`LICENSE`](LICENSE) for licensing.
