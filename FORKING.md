# Forking Guide

Detailed companion to the **Fork it** section in the [README](README.md#fork-it). This file covers Level 1 — re-theming the game and re-tuning the feel without touching the engine.

## The fork map

The codebase splits cleanly into two zones:

```
src/game/
  config/                       ← FORK SURFACE
    characters.ts                   palette + names                   (re-theme)
    ranks.ts                        career ladder + salary curves     (re-theme)
    tuning.ts                       ~26 gameplay-feel knobs           (re-tune)

  scenes/
    Preloader.ts                ← FORK SURFACE (two methods only)
                                    generateRacerTexture()            (re-theme)
                                    generateTrackTexture()            (re-theme)
    MainMenu.ts                 ← FORK SURFACE (strings only)
    Game.ts                     ← FORK SURFACE (banner strings only)
    GameOver.ts                 ← FORK SURFACE (headline + flavour)
    Boot.ts                     ← engine

  objects/                      ← engine — do not edit
  systems/                      ← engine
  ui/                           ← engine
```

If a change requires editing anything outside the fork surface, it's a rebuild — see Level 2 in the README.

---

## Part A — Re-theme

Six surfaces. Touch as few or as many as you like — they're independent.

### 1. Characters

File: [`src/game/config/characters.ts`](src/game/config/characters.ts)

Six entries. Each is `{ name, bodyColor, shirtColor, chairColor, textureKey }`. Nothing about "Gary" or "Linda" is referenced anywhere else in the codebase — it's pure data. Swap names, swap the three palette slots per character, and you're done.

Field meaning:
- `bodyColor` — head and arms (skin in office theme; could be horse coat, robot chassis, etc.)
- `shirtColor` — torso block
- `chairColor` — vehicle/seat color
- `textureKey` — must be unique; referenced by `Preloader.ts` and the scene at startup.

### 2. The career ladder

File: [`src/game/config/ranks.ts`](src/game/config/ranks.ts)

Six ranks, each `{ index, title, baseSalary, promoteMultRange, demoteMultRange }`.

What changes the *theme*:
- `title` — the rank name shown in the HUD, popups, and main menu (the abbreviated array in `MainMenu.ts` also needs to match).
- `baseSalary` — only seeds the starting value. Its *unit* (money) is implied by the `$` symbol in `HUD.ts` and the "Final Salary" string in `Game.ts` + `GameOver.ts`. If you change the unit (XP, doubloons, followers, MMR), update those three strings too.

What changes the *feel* (technically tuning, but lives here because it's per-rank):
- `promoteMultRange` — `[min, max]` salary multiplier when promoted *to* this rank. The randomness inside the range is the whole "raises feel arbitrary" punchline; keep some spread.
- `demoteMultRange` — `[min, max]` multiplier applied to current salary on demotion *from* this rank.

Ladder shapes that fit the existing mechanics without code changes:
- Stable Boy → Royal Stallion (medieval purse)
- Bronze → Grand Master (esports MMR)
- Cabin Boy → Captain (pirate doubloons)
- Associate → Don (mafia tribute)
- Micro → Verified (influencer followers)
- Intern → Founder (startup equity)

### 3. Racer sprite

File: [`src/game/scenes/Preloader.ts`](src/game/scenes/Preloader.ts) — `generateRacerTexture()`

A 60×80 px canvas. The sprite origin in-game is `(0.5, 0.8)` so the bottom of the chair sits on the lane line. Currently composed of: chair back, seat, pole, three wheels, torso, head, two arms — all primitives (`fillRect`, `fillCircle`, `fillRoundedRect`).

Constraints:
- Stay inside 60×80 px.
- Anchor the visible "ground contact" (wheels, hooves, feet, treads) near the bottom-ish so the `(0.5, 0.8)` origin still reads correctly.
- The three character colors (`bodyColor` / `shirtColor` / `chairColor`) are just three named slots — rename them in your head as needed (e.g. coat / saddle / horse for a horse).

### 4. The corridor

File: [`src/game/scenes/Preloader.ts`](src/game/scenes/Preloader.ts) — `generateTrackTexture()`

A 256×768 px texture, **tileable horizontally** (the background uses `TileSprite` with `tilePositionX` scrolling).

Hard constraints:
- Three lane bands at `y = 516, 586, 656` (each 70 px tall). These must match `RACE_TUNING.laneY = [550, 620, 690]` in `tuning.ts` minus the sprite origin offset. If you shift the lanes, update `laneY` too.
- Left edge must butt against right edge cleanly (or the seam will be visible every 256 px).

Everything between the lanes and the ceiling (y = 0 to ~508) is free. Swap the office wall + door + plant + bookshelf + clock + window + desk for: castle hallway, racetrack rail + grandstand, hotel corridor, parking garage, runway, dojo, prison wing.

### 5. Strings & flavour

Six theme-coupled string sites:

| File | Line | What |
|---|---|---|
| `MainMenu.ts` | ~19, 27 | Title — "OFFICE CHAIR" / "RACING CHAMPIONSHIP" |
| `MainMenu.ts` | ~36 | Subtitle — "Climb the tech ladder at 30mph" |
| `MainMenu.ts` | ~48 | Abbreviated ladder array (must match `ranks.ts` titles) |
| `MainMenu.ts` | ~92 | "Reach Junior Dev and you're FIRED!" |
| `Game.ts` | ~315 | Banner strings — "YOU'RE FIRED!" / "SLACKING OFF!" |
| `Game.ts` | ~120 | NPC label substitution — "AI" (could be "GHOST", "RIVAL", "HEIR", "BOSS") |
| `Game.ts` | ~346 | "Final Salary: $…" — change currency symbol here if the ladder unit changes |
| `GameOver.ts` | ~19–22 | Headlines + flavour ("access card revoked", "Management does not pay people…") |

### 6. Palette

Theme accent colors are scattered across MainMenu, Game, GameOver, and HUD. The ones worth knowing:

- `MainMenu.ts` — bg `0x1a1a2e`, accent yellow `0xffdd00`, accent orange `0xff6600`.
- `GameOver.ts` — bg `0x1a0000`, headline red `#ff3300`, salary yellow `#ffdd00`.
- `HUD.ts` — rank text yellow `#ffdd00`.
- `tuning.ts` → `NPC_TUNING.chaseFlashColors` — `[0xff4444, 0xffee44]`. These two are the *visual signal* that an NPC is now a threat. Pick any high-contrast pair that reads as danger in your theme.

---

## Part B — Re-tune

All numbers below live in [`src/game/config/tuning.ts`](src/game/config/tuning.ts). Three groups.

### `PLAYER_TUNING`

| Knob | Default | Effect |
|---|---|---|
| `pumpBoost` | 80 | Speed added per alternating ←/→ press. Higher = punchier pump, easier to overtake. |
| `naturalDecel` | 90 px/s² | Passive speed decay. Higher = stop pumping for a moment and you stall fast. Lower = forgiving. |
| `maxSpeed` | 630 | Player ceiling. Lower = harder to escape chasers; higher = chasers can't keep up. |
| `laneChangeCooldownMs` | 300 | Anti-spam on ↑/↓. Lower = snappier. |
| `laneChangeLerpSpeed` | 12 | How fast the player visually glides between lanes. Higher = snap; lower = drift. |

### `NPC_TUNING`

The **tier table** is the heart of difficulty:

| Tier | `base` | `max` | `paceGap` |
|---|---|---|---|
| slow | 240 | 260 | 200 |
| medium | 310 | 370 | 100 |
| fast | 385 | 440 | 50 |

`base` is the cruise speed before the player gets close. `max` is the tier ceiling. `paceGap` is the most important — it's how far *below* the player's live speed each tier ramps to in pace mode. Smaller gap = harder to pass.

Want every NPC to feel beatable? Raise the gaps. Want a brutal climb to CEO? Set all three to ≤ 30.

Ramps and feel:

| Knob | Default | Effect |
|---|---|---|
| `paceDurationSec` | 5 | Seconds for an NPC to ease into pace target. Shorter = pressure arrives faster. |
| `chaseDurationSec` | 5 | Seconds for a passed NPC to ramp into chase. Shorter = no breathing room post-overtake. |
| `initialSpeedMultiplier` | 0.3 | Scale applied to base at spawn. Why NPCs reveal *slow*. |
| `initialSpeedJitter` | `[0.5, 0.9]` | Extra random band around the spawn scaling. |
| `oscillationPeriodSecRange` | `[3, 7]` | How often each NPC wobbles. |
| `oscillationAmplitude` | 0.10 | ±fraction of base on the wobble. Higher = more chaos. |
| `acceleration` / `deceleration` / `naturalDecel` | 150 / 200 / 60 | NPC speed control. Rarely worth touching. |

Chase visual signal:

| Knob | Default | Effect |
|---|---|---|
| `chaseFlashIntervalMs` | 220 | Toggle rate for the red↔yellow flash. Lower = more frantic. |
| `chaseFlashColors` | `[0xff4444, 0xffee44]` | The two flash tints. |

### `RACE_TUNING`

Where the race is staged and what pressure arrives when:

| Knob | Default | Effect |
|---|---|---|
| `playerScreenX` | 260 | Where the player is pinned horizontally. Higher = more runway visible ahead. |
| `laneY` | `[550, 620, 690]` | The three lane Y positions. Must match the track texture's lane bands. |
| `npcTiers` | `['slow','medium','medium','fast','fast']` | Tier mix across the 5 NPCs. The length of this array is *the* NPC count — see structural caveats. |
| `npcPreRevealDistances` | `[-360, -200, -100, 160, 320]` | Where NPCs sit before the reveal. Mostly cosmetic — these visible-but-doomed colleagues set the scene. |
| `npcSpawnOffsets` | `[800, 1600, 2400, 2600, 2800]` | Where NPCs jump to when revealed (ahead of player). First gap = how long until first overtake opportunity. Tight clustering at the top = the CEO sprint feels packed. |
| `npcRevealDelayMsRange` | `[3000, 5000]` | After race start, how long before NPCs reveal. |
| `chaseTargetOffset` | 50 | Speed-above-player a chase NPC ramps to. Higher = chasers actually catch you. |
| `pursuitNpcSpeedOffset` | 50 | Same idea, for the post-fired pursuer. |
| `pursuitNpcSpawnOffset` | -700 | How far behind the player the pursuer appears. |
| `pursuitNpcTier` | `'fast'` | Tier of the pursuer. |
| `idleFireMs` | 500 | Stop pumping this long after race start → fired. Forgiveness dial. |

---

## A worked example: horse race

What changes vs. doesn't, in one re-skin:

| Surface | Office original | Horse-race re-skin |
|---|---|---|
| `characters.ts` | Gary, Linda, Raj… | Storm, Silver, Lightning… |
| `characters.ts` palette slots | skin / shirt / chair | coat / saddle / blanket |
| `ranks.ts` titles | Junior Dev → CEO | Stable Boy → Royal Stallion |
| `ranks.ts` units | `$` salary | `₤` purse |
| `Preloader.ts:generateRacerTexture` | Office chair + person | Horse + jockey |
| `Preloader.ts:generateTrackTexture` | Office corridor, plant, bookshelf, window, desk, door | Track rail, grandstand, finish flags, ad boards |
| Strings | "YOU'RE FIRED!" / "SLACKING OFF!" | "DISMOUNTED!" / "REFUSED!" |
| AI label | "AI" | "FAVOURITE" |
| Chase flash colors | red ↔ yellow | red ↔ white |
| `tuning.ts` | unchanged | unchanged |

Zero engine files touched.

---

## Structural caveats

Three numbers look like tuning knobs but are actually structural — changing them cascades into other files:

- **Lane count (3).** Hardcoded by the length of `RACE_TUNING.laneY`. Changing it requires: `Player.ts` lane-change bounds (currently `lane > 0` and `lane < 2`), the track texture's lane bands in `Preloader.ts`, and the lane shuffle in `Game.ts:create` (currently `[0,0,1,1,2,2]`).
- **NPC count (5).** Driven by `RACE_TUNING.npcTiers.length`. If you change it, the other npc* arrays in `tuning.ts` must match length, and `HUD.ts` shows `/6` (NPC count + 1 for the player).
- **Rank count (6).** `RANKS.length` is implicitly tied to NPC count + 1 (one rank per NPC you can overtake, plus the starting rank). Changing it without changing NPC count breaks the "every overtake = promotion, every demotion = passed by an NPC" loop.

These three are forkable but they cascade. The other ~26 knobs are not structural and can be changed in isolation.

---

## What you cannot fork at Level 1

These changes need engine edits and push you toward Level 2 (rebuild):

- **Different input modality** — touch-swipe instead of alternating keys, accelerometer, mouse drag. The pump mechanic lives in `Player.ts:updateRacer`.
- **Different scrolling direction** — vertical instead of horizontal would need the background's `tilePositionX` → `tilePositionY` plus a swap of the lane axis.
- **Continuous progression instead of discrete ranks** — RaceManager, HUD, and RankPopup all assume discrete rank events.
- **Different fail rules** — e.g. idle is fine, demoting past rank 0 is fine, time-based fail instead. The two failure paths are hardcoded in `Game.ts:triggerGameOver` and `RaceManager.handleOvertake`.

If your fork needs any of these, you're not re-theming — you're rebuilding. Skip to Level 2 in the README.
