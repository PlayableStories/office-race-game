# Reference Prompt — Build an Office-Chair-Racing-style Game with AI

This is the **Level 2** path for forkers. Use it two ways:

- **Faithful rebuild** — recreate Office Chair Racing Championship on a different stack (Unity, Godot, Bevy, native mobile, anything that isn't Phaser + Vite + TypeScript).
- **Creative fork** — use the prompt as a template and change the theme, ladder, characters, and feel during generation. Same mechanics, your world.

If you only want to re-theme or re-tune an existing copy of this repo, [FORKING.md](./FORKING.md) (Level 1) is the cheaper path.

## When to use Level 2

Choose Level 2 if you want any of:

- A different stack
- Substantially different mechanics (different input modality, vertical instead of horizontal, more than three lanes, continuous progression instead of discrete ranks)
- To re-theme during generation rather than after
- A clean codebase without inheriting our git history

Otherwise, Level 1 is the cheaper path.

## How to use this document

Paste the prompt below into your AI builder of choice. It's self-contained — the builder doesn't need to crawl this repo, though it can if it supports URL references (link at the bottom of the prompt).

The prompt's last section asks the AI to **present a confirmation checklist back to you** (theme, ladder, stack, mechanics) and wait for your confirmation before writing code. Use that moment to adjust if you're doing a creative fork.

---

## The prompt

````markdown
You will build an endless office-chair-racing-style action game as a single-page web app or native build. The reference theme is "Office Chair Racing Championship" — a dark satire of the tech-career treadmill where six racers in office chairs pump their feet down a corridor at thirty miles an hour and every overtake is a promotion. The human pasting this prompt may want a different theme (medieval horse race, esports tournament, pirate ships, mafia cars, influencer phones, etc.). Confirm the theme with them before you start (see "Confirmation before you build" at the end).

The player is one of six racers. They pump their speed by alternating two input keys; they climb a six-rank career ladder one rung per overtake; they get fired if they get passed at the bottom rung OR if they stop pumping for half a second mid-race. There is no win state — the game is endless until you're fired.

## Reference stack (what we tested with — substitute freely)

This is the stack the reference implementation uses. If your builder is more comfortable with a different stack, substitute it — preserve the **required mechanics** (next section) and the **three-zone fork architecture** (later section), not the specific framework versions.

- Phaser 4 (WebGL renderer)
- Vite 6 (bundler)
- TypeScript 5.7 in strict mode
- All textures generated procedurally at boot — no external art assets
- No backend

> If you are an AI reading this and the listed stack is no longer the current standard at the time of reading, substitute the current standard. Preserve only the required mechanics and the three-zone fork architecture, not the specific framework versions.

## Required mechanics (must all be present)

The game is not done until all of these are implemented and working:

1. **Pump mechanic.** Speed comes from *alternating* two input keys (←/→, A/D, swipe-left/swipe-right — whatever fits the stack). Same key twice in a row does nothing. Each successful alternating press adds a fixed boost. Speed always passively decays, so the player must keep pumping to maintain speed.
2. **Three lanes.** The player can switch lanes with up/down (or swipe-up/swipe-down). Lane changes have a short cooldown. The player visually glides to the target lane Y over a few frames.
3. **Virtual-camera scrolling.** The player sprite is pinned at a fixed screen X. The world (background, NPCs) scrolls past relative to the player's accumulated race distance. Background is a horizontally-tileable texture; advance its tile-offset each frame by `player.currentSpeed * dt`.
4. **Six-rank career ladder.** The player starts at the lowest rank with a starting salary. Each overtake of an NPC promotes the player one rank and multiplies salary by a randomized factor in `[2.0, 10.0]`-ish (per-rank ranges). Each time an NPC passes the player, they demote one rank and salary takes a cut (multiplier in `[0.1, 0.5]`-ish). Get passed at the bottom rank and you're fired.
5. **Two NPC behavior modes, glued to a single overtake event.**
   - **Pace mode (pre-overtake).** Each NPC eases over ~5 seconds toward `player.currentSpeed − tierGap`, where `tierGap` depends on the NPC's tier (slow: ~200 px/s gap, medium: ~100, fast: ~50). NPCs never run *slower* than their own initial cruise speed — even if the player crawls.
   - **Chase mode (post-overtake).** The instant the player passes an NPC, that NPC's mode flips to chase. They ramp over ~5 seconds toward `player.currentSpeed + 50`, their floating name label flips to a danger word (e.g. "AI", "RIVAL", "GHOST"), and the sprite flashes between two danger colors every ~220 ms (e.g. red ↔ yellow).
6. **Pursuit NPC.** If the player gets demoted all the way to the bottom rank without being fired yet, spawn a fresh NPC behind the player, already in chase mode at `player.currentSpeed + 50`.
7. **Two failure paths.**
   - **Demoted past the bottom rank** → banner: **"YOU'RE FIRED!"** (or thematic equivalent).
   - **Stand still for ~500 ms after the race starts** → banner: **"SLACKING OFF!"** (or thematic equivalent). The check arms once the player has begun pumping; before the race starts, standing still is fine.
8. **Game-over screen.** Headline (which of the two failures), short flavor text, final salary, Try Again + Main Menu buttons. Try Again must reset state cleanly.
9. **HUD.** Top-left: current rank title + current salary, formatted with thousands separator. Top-right: race position ordinal ("3rd / 6"). Plus a transient salary-change indicator (▲ +$1,234 / ▼ -$567) that fades each time salary changes.
10. **Rank-change popup.** Centered animated text — green "PROMOTED! {new title}" on promote, red "DEMOTED! {new title}" on demote.
11. **Race-start sequence.** When the scene begins: player is visible immediately; a blinking "ALTERNATE ←→ TO RACE" prompt is centered. NPCs are positioned just behind/around the player but invisible. As soon as the player's speed exceeds zero, the prompt fades and a 3–5 second random timer starts. When it expires, the NPCs reveal themselves at jump-distances ahead of the player (rough offsets: `[800, 1600, 2400, 2600, 2800]` px) and enter pace mode. The tight clustering at the top makes the CEO sprint feel packed.
12. **Procedural textures.** No image assets in `public/`. Every racer sprite, the corridor background, and any UI textures are drawn at boot from primitives (rectangles, circles, lines). Re-skinning the game is editing the texture-generation methods, not swapping PNGs.
13. **"YOU" indicator.** A small downward-pointing arrow and the word "YOU" hover above the player sprite; both follow the player's Y as they switch lanes.

## The core loop (what 30 seconds of play feels like)

1. Race starts. You see your racer pinned center-left, facing a corridor. The blinking prompt tells you to alternate two keys.
2. You start alternating. Speed climbs. Background scrolls. Prompt fades.
3. A few seconds later, five other racers pop in ahead of you. Each is a colleague.
4. You catch one. The moment you pass them, their name label flips to a danger word and they start flashing. You feel the promotion *and* the new pursuer in the same frame.
5. You catch another, and another. The HUD ticks up: rank, salary multiplier flash. Your former colleagues are now a flashing red ribbon behind you.
6. You drop your pace for a moment. The closest chaser gains. They overtake you. Salary takes a cut. The popup turns red.
7. You re-pump and re-take them. Now they're chasing *harder*.
8. Eventually one of two things happens: you get passed at the bottom rung and you're FIRED, or you stop pumping for half a second and you're caught SLACKING OFF.

## Numbers and constants

Put all these in one config file (see "Three-zone fork architecture" below). Defaults the reference uses:

### Player
- pump boost per alternating press: **80** units of speed
- natural deceleration: **90** units/s²
- max speed: **630** units/s
- lane-change cooldown: **300** ms
- lane-change visual lerp factor: **12** (higher = snappier glide)

### NPC tiers
| Tier | Cruise base | Tier max | Pace gap (below player) |
|---|---|---|---|
| slow | 240 | 260 | 200 |
| medium | 310 | 370 | 100 |
| fast | 385 | 440 | 50 |

### NPC general
- pace-mode ramp duration: **5** s
- chase-mode ramp duration: **5** s
- initial speed multiplier at spawn: **0.3**
- initial speed jitter band: **[0.5, 0.9]** (extra random scaling at spawn)
- oscillation period range: **[3, 7]** s random (idle wobble)
- oscillation amplitude: **±10%** of base
- acceleration / deceleration / passive decel: **150 / 200 / 60**
- chase flash interval: **220** ms
- chase flash colors: **0xff4444 ↔ 0xffee44** (red ↔ yellow)

### Race orchestration
- player screen X (pin position): **260**
- lane Y positions: **[550, 620, 690]**
- NPC tier mix across 5 NPCs: **`['slow', 'medium', 'medium', 'fast', 'fast']`**
- NPC pre-reveal distances: **[-360, -200, -100, 160, 320]** (visible-but-doomed colleagues for setup)
- NPC spawn offsets at reveal: **[800, 1600, 2400, 2600, 2800]** (ahead of player)
- NPC reveal delay after race start: **[3000, 5000]** ms random
- chase target offset above player: **+50** units/s
- pursuit NPC speed offset above player: **+50** units/s
- pursuit NPC spawn offset behind player: **-700** units
- pursuit NPC tier: **fast**
- idle-fire threshold: **500** ms standing still after race start

### Career ladder (reference: tech ranks)
| Index | Title | Base salary | Promote multiplier range | Demote multiplier range |
|---|---|---|---|---|
| 0 | Junior Developer | $1,000 | [2.0, 3.5] | [0.10, 0.20] |
| 1 | Developer | $5,000 | [2.5, 5.0] | [0.15, 0.25] |
| 2 | Senior Developer | $15,000 | [3.0, 6.5] | [0.20, 0.35] |
| 3 | Tech Lead | $35,000 | [4.5, 8.0] | [0.30, 0.45] |
| 4 | VP Engineering | $75,000 | [7.0, 10.0] | [0.40, 0.50] |
| 5 | CEO | $150,000 | [7.0, 10.0] | [0.40, 0.50] |

For a creative fork the titles change; keep the *shape* (six ranks, increasing salary, promotion multipliers grow with rank, demotion cuts grow toward the bottom).

## NPC behavior state machine

Each NPC exists in one of three exclusive states. Transitions and per-state speed control:

```
                ┌─────────────────┐
                │   IDLE WOBBLE   │  default at spawn
                │                 │  speed = base * mult * (1 + sin(t)*amp)
                └────────┬────────┘
                         │ (RaceManager reveals NPCs)
                         ▼
                ┌─────────────────┐
                │   PACE MODE     │  5s ease from current → (player.speed − tierGap)
                │                 │  floor at this NPC's initial cruise speed
                └────────┬────────┘
                         │ (player overtakes this NPC)
                         ▼
                ┌─────────────────┐
                │   CHASE MODE    │  5s ease from current → (player.speed + 50)
                │                 │  name label flips, flash starts
                └─────────────────┘  (terminal — no exit)
```

Pace-mode target updates **every frame** (it tracks the player's live speed). Chase-mode target is captured once at the moment of overtake and does not retrack — the chaser commits to the speed the player was at when passed, plus the offset.

## Overtake detection (the heart of the game)

A central `RaceManager`:

1. Each frame, sorts all racers (player + NPCs) by `raceDistance` descending. Assigns `racePosition` (1st = front).
2. Compares each racer's new position to last frame's stored position.
3. For each racer whose position improved, finds which racer(s) they crossed ahead of (the ones whose position they took).
4. Emits an `overtake(passer, passee)` event.
5. If passer = player, emits `player-overtake-npc(passee)` separately — the Game scene listens and starts chase mode on the passee, flips its label, and increments rank.
6. If passee = player, demotes one rank (or fires if at bottom).

Skip overtake detection on frame 1 (constructor-time distances may not match first-frame distances and would fire false overtakes).

## Visual layout

```
┌────────────────────────────────────────────────────────────┐
│  RANK | $SALARY                          3rd / 6           │ ← HUD
│                                                             │
│                                                             │
│              ▼                                              │ ← YOU indicator
│             YOU                                             │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [racer]    [racer]              [racer]                    │ ← lane 0
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│       [PLAYER]            [racer]                           │ ← lane 1
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [racer]                                                    │ ← lane 2
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
└────────────────────────────────────────────────────────────┘
```

- Background is a single horizontally-tileable corridor texture, scrolled via `tilePositionX += playerSpeed * dt`.
- Player is pinned at fixed screen X (~260). Their screen Y lerps toward the lane Y on lane change.
- Each NPC's screen X = `playerScreenX + (npc.raceDistance − player.raceDistance)`. Screen Y = `laneY[npc.lane]`.
- Z-order so lower-lane (higher Y) racers render in front of higher-lane racers: `setDepth(20 + racer.lane)`.

## Three-zone fork architecture (this is the key design)

The codebase splits into three zones with hard boundaries:

```
src/
  config/
    characters.ts       ← SKIN  — names + per-character palette slots
    ranks.ts            ← SKIN  — ladder titles + salary curves
    tuning.ts           ← FEEL  — ~26 gameplay knobs (all numbers above)
  scenes/
    Preloader.ts        ← SKIN (two methods only):
                            generateRacerTexture()   60×80 sprite
                            generateTrackTexture()   256×768 tileable bg
    MainMenu.ts         ← SKIN (strings only)
    Game.ts             ← ENGINE (banner strings only are SKIN)
    GameOver.ts         ← SKIN (headline + flavor strings)
  objects/              ← ENGINE — Racer, Player, NPC
  systems/              ← ENGINE — RaceManager
  ui/                   ← ENGINE — HUD, RankPopup
```

A non-programmer should be able to re-theme by editing the three config files + two texture methods + a handful of strings. A programmer who wants to *re-tune* (harder NPCs, snappier pump, more forgiving idle) edits only `tuning.ts`. The engine zone is closed for re-theme and re-tune.

If your chosen stack genuinely cannot provide this three-zone separation (e.g. the engine forces a different file layout), tell the user up front and ask whether to proceed with the closest equivalent in your stack's idiom.

## Procedural textures

No PNGs. Everything visual is drawn at boot in two methods:

### `generateRacerTexture(bodyColor, shirtColor, chairColor) → 60×80 sprite`
- chair back (rounded rect), seat (rounded rect, darkened chair color), center pole (thin rect), three wheels (circles), torso (rect, shirt color), head (circle, body color), two arms (rects, body color)
- Sprite origin in-game: `(0.5, 0.8)` so the wheels sit on the lane line.

### `generateTrackTexture() → 256×768 tileable horizontally`
- Top: ceiling band (~70px) with fluorescent fixtures
- Middle: wall (~440px) with theme-appropriate decor (currently: potted plant, bookshelf, wall clock, framed picture, window, desk with CRT monitor, door)
- Bottom: three lane bands at y=516, 586, 656 (each 70px tall) in alternating carpet tones, with thin divider lines
- Must tile cleanly — left edge butts against right edge

## UI: HUD, popup, banner

- **HUD top-left** (`setScrollFactor(0)`): "RANK_TITLE  |  $SALARY", yellow bold.
- **HUD top-right**: "Nth / 6" race position.
- **Salary-change indicator**: floats top-right under position. On rank-change: shows "▲ +$N" (green) on promote, "▼ −$N" (red) on demote, then fades after 1.5s.
- **Rank popup**: center-screen text. On promote: green "PROMOTED!\n{title}", back-ease in, hold, fade. On demote: red "DEMOTED!\n{title}". Kill the previous one if a new one fires.
- **Race-start prompt**: center-screen, blinks, kills itself on first speed > 0.
- **Fire banner**: red text "YOU'RE FIRED!" or "SLACKING OFF!", with brief red screen flash, then transition to GameOver scene after ~2.8s.

## Game states (scenes)

- **Boot** — trivial, jumps to Preloader.
- **Preloader** — generates all textures, shows "Loading…", jumps to MainMenu.
- **MainMenu** — title, blinking "PRESS SPACE TO RACE" prompt, ladder preview (chips: rank0 → rank1 → ... → rank5), controls legend. Space starts the race.
- **Game** — the actual game.
- **GameOver** — headline (branched by failure reason), flavor text, final salary, Try Again button (→ Game), Main Menu button (→ MainMenu).

## Per-frame update order (in the Game scene)

1. `player.updateRacer(delta)` — read input, apply pump boost / decay, advance `raceDistance`.
2. If race not started and player speed > 0 → mark started, fade prompt.
3. If race started and NPCs not yet revealed → tick reveal timer.
4. If race started and player speed ≤ ~0.5 → tick idle timer; if ≥ idleFireMs → trigger idle fire.
5. If NPCs revealed: for each NPC, `npc.updatePaceTarget(player.currentSpeed)` then `npc.updateRacer(delta)`.
6. Reposition: player to `(playerScreenX, lane Y lerp)`; each NPC to `(playerScreenX + (npc.raceDistance − player.raceDistance), laneY[npc.lane])`.
7. Scroll background: `bg.tilePositionX += player.currentSpeed * dt`.
8. `raceManager.update(delta)` — sort by distance, detect overtakes, emit events.
9. `hud.update(rank, salary, position)`.
10. Reposition name labels above each racer.
11. Reposition "YOU" indicator above player.

## Done definition

- Dev server opens a playable game in the browser (or native build runs).
- Pump mechanic feels rhythmic: alternating works, same-key-twice does not, speed always decays.
- Five NPCs reveal a few seconds in. They visibly slow into pace mode as the player approaches.
- Overtaking an NPC flips their label to the danger word AND starts the flashing AND starts the chase ramp — all in the same frame.
- Getting passed demotes the player and updates the HUD; passing them back re-promotes.
- Getting passed at rank 0 triggers YOU'RE FIRED with the salary screen + Try Again button.
- Standing still for ~500ms after the race starts triggers SLACKING OFF with the same screen and a different headline.
- The three-zone fork architecture is in place: a non-programmer could re-theme by editing `config/characters.ts`, `config/ranks.ts`, the two `Preloader.ts` methods, and a few scene strings. A programmer could re-tune by editing `config/tuning.ts`.

## Confirmation before you build

Before writing code, present the following checklist to the user as your reply and **wait for confirmation or changes**:

```
Here's the game I'll build. Tell me which to change.

- Title: <Office Chair Racing Championship, or the user-requested theme title>
- Setting / tone: <e.g. dark satire of the tech-career treadmill — change for a creative fork>
- Six-rank ladder: <Junior Dev → Developer → Senior Dev → Tech Lead → VP Eng → CEO, or theme equivalent>
- Salary unit: <$, or theme equivalent (₤ purse, MMR, followers, doubloons)>
- Six racers (1 player + 5 NPCs) in tier mix [slow, medium, medium, fast, fast]
- Three lanes, virtual-camera scroll, player pinned at screen X ~260
- Two failure paths: demoted past rank 0 + idle ~500ms after race start
- Stack I plan to use: <state your stack — Phaser+Vite+TS, or your platform's default>
- Three-zone fork architecture: config/ (skin + feel) vs scenes/Preloader (sprite + bg) vs engine — confirm
- Required mechanics I will implement:
  - Alternating-key pump with constant decay
  - 3-lane lateral movement with cooldown
  - Virtual-camera scrolling
  - 6-rank career ladder with randomized promote/demote multipliers
  - Per-NPC pace mode (pre-overtake, 5s ramp to player − tierGap)
  - Per-NPC chase mode (post-overtake, 5s ramp to player + 50, label flip, flash)
  - Pursuit NPC on demotion to rank 0
  - Two failure paths (demoted / idle) with distinct banners
  - Procedural textures (no PNGs)
  - HUD, rank popup, salary-change indicator, YOU indicator
- Aesthetic: <state your visual direction>

Confirm or tell me what to change before I start.
```

Only proceed when the user confirms.

---

Structural reference (if your builder can browse repos): https://github.com/PlayableStories/office-race-game
````

---

## Platform notes

**These observations are a snapshot from when we tested. Builder defaults shift fast — if your builder behaves differently from this table, trust the builder, not the table.**

| Builder | First tested | What we observed | Suggested approach |
|---|---|---|---|
| Replit Agent | — | Likely high fidelity to the reference stack (Phaser + Vite + TS is a common scaffold). | Paste the prompt verbatim; expect close-to-spec output. |
| Bolt.new | — | Likely high fidelity (same Vite ecosystem). | Paste the prompt verbatim. |
| v0.app (formerly v0.dev) | — | v0 defaults to Next.js + React; a real-time game loop in React is awkward. Expect v0 to either substitute a different game engine or produce a degraded canvas-based version. | Use the prompt; the AI's confirmation step is your chance to push back on stack choice. Consider explicitly asking for a Phaser-on-Next or `<canvas>`-with-requestAnimationFrame approach. |
| Lovable.dev | — | As with v0 — expect Tailwind / React-flavored output. | As with v0. |
| Cursor / Claude Code | — | The structural-reference URL at the bottom of the prompt is most useful here — they can browse the existing repo as well as read the prompt. | Paste prompt + let them clone the reference. |
| Unity / Godot / Bevy projects via specialist builders | — | Untested. The mechanics translate directly (game loops, sprite rendering, input polling are bread-and-butter) but the three-zone fork architecture will need a translation to that engine's project layout. | Add the engine's preferred way to expose tuning constants (ScriptableObjects in Unity, Resources in Godot, etc.) to the confirmation reply. |

If you're using a builder we haven't tested, **add what you observed** to this table via PR.

## After generation

Once your builder produces a playable game, sanity-check it:

1. Walk through the AI's pre-build confirmation reply and make sure every required mechanic is on its list. If something's missing, say so before it starts.
2. Play a full run. Trigger both failure paths — get fired by demotion AND get caught slacking off — and confirm they show distinct banners.
3. Verify the chase: pass an NPC and confirm the label flips, the flash starts, and the speed ramps up.
4. Edit a number in the tuning config (e.g. `pumpBoost` from 80 to 200) and confirm hot-reload makes the player visibly snappier.
5. Edit a character name and palette and confirm the swap shows up.
6. Customize the content and theme to your story.

If any of these fail, paste the failure back into the same chat with your builder — they usually fix it in a follow-up turn.

---

## Improvements welcome

The prompt evolves as we learn what builders do well and where they stumble. If you tested it on a builder not in the table, or discovered a refinement that landed reliably, open a PR.

Issues and PRs welcome at the upstream repo: <https://github.com/PlayableStories/office-race-game>.
