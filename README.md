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

## The Design

Four choices shape the game:

- **The pump mechanic.** Speed only comes from *alternating* `←` / `→` — same key twice does nothing. It always decays (`naturalDecel = 90 px/s²`), so the game is an active rhythm exercise, not a hold-down-arrow grind. Implemented in [`src/game/objects/Player.ts`](src/game/objects/Player.ts).

- **Two NPC modes glued to a single overtake event.** Before you pass them, each NPC eases into *pace mode* — a 5-second ramp to `player.currentSpeed − tierGap` (200 / 100 / 50 px/s slower for slow / medium / fast). The instant the player passes one, [`RaceManager`](src/game/systems/RaceManager.ts) emits `player-overtake-npc` and that NPC flips into *chase mode* — a 5-second ramp to `player.currentSpeed + 50`, label changes to `AI`, sprite flashes red ↔ yellow. Pace tunes how hard each tier is to pass; chase means every promotion creates its own pursuer. See [`src/game/objects/NPC.ts`](src/game/objects/NPC.ts).

- **The career ladder is the only failure path.** There is no win state. Get passed at Junior Developer → fired. Stand still for 0.5 s → fired for slacking off. Two distinct game-over flavours, one shared ladder. See `triggerGameOver()` in [`src/game/scenes/Game.ts`](src/game/scenes/Game.ts).

- **All textures are procedural.** Every racer sprite, the office wall, the carpet lanes, the door, the window, the plant, and the bookshelf are drawn at boot from primitives in [`src/game/scenes/Preloader.ts`](src/game/scenes/Preloader.ts). Re-skinning the office is editing one method: `generateTrackTexture()`. This is the load-bearing fork-friendly choice.

## The Concept

Dark satire of the tech-career treadmill, with the treadmill made literal: six racers in office chairs, pumping their feet down a corridor at thirty miles an hour. Every overtake is a promotion. Every promotion comes with a randomized salary multiplier between 2× and 10× — the unpredictability is the point. It is exactly how raises actually feel.

The aim: feel the brief satisfaction of a promotion. Then notice the colleague you just passed is wearing a red `AI` label and gaining on you. Then realise you stopped pumping for half a second and security is escorting you out.

The reference arcs are tech-industry tropes — promotion velocity, AI coming for your job, the cult of *always be shipping*, the slow-then-fast collapse from CEO back to Junior Developer in a single bad week — without naming specific companies. The two firing flavours (**YOU'RE FIRED!** and **SLACKING OFF!**) are the joke's punchline: be out-paced by colleagues, *or* be caught not pumping. Either way, the access card is revoked.

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

## Fork it

The whole point of building games this small is for other people to make them their own. There are two levels of fork — they cost very different amounts of effort.

### Level 1 — Re-theme and re-tune

The game's *skin* and its *feel* are deliberately separated from the engine. Everything you'd touch lives in three config files, two texture methods, and a handful of strings — no game logic.

- **Re-theme.** Replace "Junior Developer → CEO" with "Stable Boy → Royal Stallion" or "Bronze → Grand Master" by editing [`src/game/config/characters.ts`](src/game/config/characters.ts), [`src/game/config/ranks.ts`](src/game/config/ranks.ts), the two texture methods in [`src/game/scenes/Preloader.ts`](src/game/scenes/Preloader.ts), and the on-screen flavour strings. Office chairs become horses; the corridor becomes a racetrack; the mechanics stay.
- **Re-tune.** All ~26 gameplay knobs — pump boost, decay rate, NPC tier speeds, pace and chase ramp durations, spawn offsets, idle-fire threshold — live in [`src/game/config/tuning.ts`](src/game/config/tuning.ts). Make it easier, harder, faster, more forgiving, more brutal.

Step-by-step in [`FORKING.md`](FORKING.md).

### Level 2 — Rebuild on a different stack

If you want to rebuild the same loop on Unity, Godot, Bevy, or native mobile, sister project [boardroom-game](https://github.com/PlayableStories/boardroom-game) ships a [`REFERENCE_PROMPT.md`](https://github.com/PlayableStories/boardroom-game/blob/main/REFERENCE_PROMPT.md) — a working template for describing a game-engine project to an AI code builder. Adapt it to this game's mechanics: alternating-key pump with decay, three lanes, pace→chase NPCs on overtake, and a career-ladder failure path with two flavours.

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
