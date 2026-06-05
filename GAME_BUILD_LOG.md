# Office Chair Racing Game — Build Log

> This log is written incrementally during implementation so a future AI agent can read it and recreate a similar game from scratch.

---

## Project Overview

**Genre:** Endless survival 2D side-scrolling office chair racing game  
**Engine:** Phaser 4.0.0 (WebGL only)  
**Language:** TypeScript 5.7 (strict mode)  
**Bundler:** Vite 6.3  
**Canvas size:** 1024 × 768, FIT scale with CENTER_BOTH auto-centering

**Core loop:**
- 6 racers (1 player + 5 NPCs) race along a looping 3-lane office corridor
- Player uses ← → arrow keys to brake/accelerate
- Passing an NPC = promotion + salary multiplied (×2–10, skews higher at higher ranks)
- Being passed by an NPC = demotion + salary cut (×0.1–0.5, worse cut at lower ranks)
- Getting passed while at Janitor rank = immediate game over ("You're Fired!")
- All 4 weapons (toilet roll, file clips, mop, CRT monitor) can be thrown by player AND NPCs
- No win condition — survive and grow salary as long as possible

---

## Tech Stack

| Item | Version / Detail |
|---|---|
| Phaser | 4.0.0 — WebGL only, RenderNode architecture (no custom Pipelines) |
| TypeScript | 5.7.2 — `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports` |
| Vite | 6.3.1 — dev on port 8080, `phaser` as manual chunk in prod |
| Physics | Arcade physics (gravity `{x:0, y:0}`) |
| Renderer | `Phaser.WEBGL` (explicit, not AUTO) |

**Key tsconfig flags that affect code:**
- `strictPropertyInitialization: false` — class fields don't need constructor init (but `!` is still used for clarity)
- `noUnusedLocals: true` — all declared variables must be used; prefix intentionally unused with `_`
- `allowImportingTsExtensions: true` + `moduleResolution: "bundler"` — import `.ts` files directly

---

## Architecture Decisions

### 1. Virtual-camera scrolling (not real Phaser camera)
Player sprite is pinned at a fixed screen X (`PLAYER_SCREEN_X = 260`). NPCs are positioned each frame at `PLAYER_SCREEN_X + (npc.raceDistance - player.raceDistance)`. Background TileSprite scrolls via `tilePositionX += speed * dt`. This avoids world-size concerns and infinite-world physics bounds.

**Alternative considered:** `camera.startFollow(player)` with everyone moving in world space. Rejected because it requires a very large (or infinite) physics world and complicates TileSprite repeat.

### 2. Programmatic textures (no external sprites)
All graphics drawn at runtime in `Preloader.ts` using `this.add.graphics()` → `generateTexture(key, w, h)` → `graphics.destroy()`. Textures live in Phaser's `TextureManager` and are referenced by string key everywhere.

**Why:** Eliminates any art asset dependency, making the codebase fully self-contained.

### 3. Plain-TypeScript RaceManager (not a Phaser class)
`RaceManager` is a plain TS class with its own `EventEmitter` instance (imported from `'phaser'`). It doesn't extend any Phaser base.

**Why:** Race logic (position sorting, overtake detection, rank/salary arithmetic) has zero UI or physics concerns. Keeping it framework-agnostic makes it easier to test and reason about.

### 4. Salary is a floating value, not fixed per rank
Salary compounds via random multipliers on each overtake event. Rank title changes independently (1 overtake = ±1 rank). A player can be "Supervisor" with $500,000 if they've had lucky multipliers.

### 5. Multi-lane layout (3 lanes at Y=420/520/620)
Racers are assigned one of 3 horizontal lanes at race start (2 per lane). Lanes are purely visual — race position is determined solely by `raceDistance`. Weapons can hit racers across lanes via generous hitboxes.

### 6. NPC weapon AI
Each NPC has a per-instance `weaponCooldown` timer (random 4–12s). When it fires, the NPC sets a `wantsToThrow` flag and the direction (toward nearest non-self racer). The `Game` scene reads this flag in `update()` and delegates firing to `WeaponSystem`.

---

## File Inventory

| File | Role |
|---|---|
| `src/game/main.ts` | Game config: renderer, physics, scene list, canvas size |
| `src/game/config/characters.ts` | 6 character definitions (name, colors, texture key) |
| `src/game/config/ranks.ts` | 6 rank titles + salary multiplier ranges + helper functions |
| `src/game/config/weapons.ts` | 4 weapon types + projectile speed/halt/AoE config |
| `src/game/scenes/Boot.ts` | Minimal scene — immediately starts Preloader |
| `src/game/scenes/Preloader.ts` | Generates all game textures procedurally via Graphics API |
| `src/game/scenes/MainMenu.ts` | Title screen — SPACE to start race |
| `src/game/scenes/Game.ts` | Main race scene — orchestrates all systems |
| `src/game/scenes/GameOver.ts` | "You're Fired!" screen with final salary |
| `src/game/objects/Racer.ts` | Base class for all racing entities |
| `src/game/objects/Player.ts` | Player-controlled racer (keyboard input, weapon holding) |
| `src/game/objects/NPC.ts` | AI racer (speed oscillation, weapon throw AI) |
| `src/game/objects/Projectile.ts` | Flying weapon projectile (self-destructs after timeout) |
| `src/game/objects/WeaponPickup.ts` | Track pickup item (static body, bob animation) |
| `src/game/systems/RaceManager.ts` | Rank/salary logic — detects overtakes, fires events |
| `src/game/systems/WeaponSystem.ts` | Manages pickups, projectile spawning, overlap detection |
| `src/game/ui/HUD.ts` | Fixed HUD — rank, salary, position, weapon slot |
| `src/game/ui/RankPopup.ts` | Animated centre-screen promotion/demotion text |

---

## Step-by-Step Build Order

### Step 1 — `src/game/main.ts` (updated)
- Changed renderer from `AUTO` to `WEBGL`
- Added `physics: { default: 'arcade', arcade: { gravity: { x:0, y:0 }, debug: false } }`
- Replaced single-scene list with: `[Boot, Preloader, MainMenu, Game, GameOver]`
- Changed `backgroundColor` to `'#1a1a2e'` (dark blue-black)

### Step 2 — Config files
- `characters.ts`: Array of 6 `CharacterDef` objects with hex colors and texture keys
- `ranks.ts`: Array of 6 `RankDef` objects; `promoteMultRange` and `demoteMultRange` per rank; helper functions `getPromoteMultiplier(toRankIndex)` and `getDemoteMultiplier(fromRankIndex)` use `Math.random()` within the range
- `weapons.ts`: `Record<WeaponType, WeaponDef>` with halt durations, projectile speeds, spread flags, AoE radius

### Step 3 — Boot + Preloader scenes
- **Boot**: Single `create()` that calls `this.scene.start('Preloader')`
- **Preloader**: All texture generation happens synchronously in `create()`:
  - 6 racer sprites (60×80px) — layered body parts drawn with `fillStyle` + shape methods
  - 4 weapon icons (32×32px) — simple iconic shapes
  - 1 track tile (256×768px) — office corridor with 3 carpet lanes
  - **Phaser 4 API used:** `graphics.generateTexture(key, width, height)` — registers texture in `this.textures`

### Step 4 — MainMenu scene
- Background rectangle, title text, blinking SPACE prompt (alpha tween with `yoyo:true, repeat:-1`)
- Controls legend text at bottom
- `this.input.keyboard!.addKey(KeyCodes.SPACE)` + `JustDown` check in `update()`

### Step 5 — Racer base class (`objects/Racer.ts`)
- Extends `Physics.Arcade.Sprite`
- Key fields: `racerName`, `lane`, `raceDistance`, `currentSpeed`, `racePosition`, `isHalted`, `haltTimer`
- `halt(duration)`: sets `isHalted=true`, extends if already halted
- `updateHalt(delta)`: ticks `haltTimer`, clears `isHalted` when expired
- `updateRacer(delta)`: called each frame — advances `raceDistance += currentSpeed * (delta/1000)`; subclasses override and call `super`
- **Phaser 4 note:** After `scene.physics.add.existing(this)`, cast body: `(this.body as Physics.Arcade.Body).setGravityY(0)`

### Step 6 — Player class (`objects/Player.ts`)
- `cursors` via `scene.input.keyboard!.createCursorKeys()`
- `heldWeapon: WeaponType | null` — only one weapon at a time
- `override updateRacer(delta)`: right arrow → accelerate, left arrow → brake, else → natural deceleration
- `checkThrow()`: returns `'forward' | 'backward' | null` using `JustDown` (one-frame only)

### Step 7 — NPC class (`objects/NPC.ts`)
- Speed oscillation: `sin((timer/period)*2π + phase) * 0.1 * baseSpeed` added to target speed
- `weaponCooldown` ticks down; when ≤0 sets `wantsToThrow=true` and `throwDirection` based on nearest racer
- `heldWeapon` is set randomly when cooldown fires

### Step 8 — Projectile + WeaponPickup
- `Projectile`: `Physics.Arcade.Sprite`, fires with `setVelocity(vx, vy)`, self-destructs at `MAX_LIFE=4000ms`
- `WeaponPickup`: `Physics.Arcade.Sprite` with static body; bob tween on Y axis

### Step 9 — RaceManager (`systems/RaceManager.ts`)
- Overtake detection: sort by `raceDistance` desc each frame, compare positions to previous frame
- Rank up: `rankIndex++`, `salary *= getPromoteMultiplier(rankIndex)`
- Rank down: `salary *= getDemoteMultiplier(rankIndex)`, `rankIndex--`
- Fired: `rankIndex === 0` and player is passee → emit `'game-over'`
- Uses `new Phaser.Events.EventEmitter()` (imported from `'phaser'`)

### Step 10 — WeaponSystem (`systems/WeaponSystem.ts`)
- `physics.add.overlap(player, pickupGroup, cb)` — player collects pickups
- `physics.add.overlap(projectileGroup, racerGroup, cb)` — projectile hits racer
- NPC throw direction: check if target is ahead (raceDistance > npc.raceDistance) → `'forward'`, else `'backward'`
- CRT Monitor AoE: after hit, loop all racers within `aoeRadius` px of impact and multiply `currentSpeed *= aoeSlowFactor`

### Step 11 — HUD (`ui/HUD.ts`)
- All elements use `setScrollFactor(0)` and `setDepth(100+)` to stay fixed on screen
- Salary formatted with `toLocaleString()`: `$${Math.floor(salary).toLocaleString()}`
- `update(rankIndex, salary, position, weaponName)` called every frame from Game scene

### Step 12 — RankPopup (`ui/RankPopup.ts`)
- Creates a temporary `Text` game object at screen centre
- Tween: alpha 0→1 with `Back.Out` ease (200ms), hold 1200ms, then alpha 1→0 + move up (300ms)
- `onComplete` callback destroys the text object

### Step 13 — Game scene (`scenes/Game.ts`)
- `TileSprite` for background: `this.add.tileSprite(0, 0, 1024, 768, 'track_tile').setOrigin(0,0)`
- Lane assignment: shuffle `[0,0,1,1,2,2]` — guarantees 2 racers per lane
- Depth sort: `racer.setDepth(20 + racer.lane)` — bottom lane (2) renders in front
- On `'game-over'` event: freeze player, show "YOU'RE FIRED!" tween, then `delayedCall(2500, startGameOver)`

### Step 14 — GameOver scene
- Dark red background, large "YOU'RE FIRED!" text
- Receives `{ finalSalary }` via scene data
- Restart button: `setInteractive({ useHandCursor: true })`, `pointerdown` → `scene.start('Game')`

---

## Game Mechanics Implementation Notes

### Race Position Tracking
Each frame in `RaceManager.update()`:
1. `allRacers.sort((a,b) => b.raceDistance - a.raceDistance)` — descending by distance
2. Assign `racer.racePosition = index + 1` (1 = leader)
3. Compare each racer's new position to `previousPositions` map
4. If racer moved to a lower position number AND another racer moved to a higher number: overtake occurred
5. `handleOvertake(passer, passee)` fires once per pair

### Salary Multiplier Calculation
```typescript
// Promotion: salary multiplied by random value in rank's promoteMultRange
salary = salary * (min + Math.random() * (max - min));

// Demotion: salary multiplied by a fraction (0.1–0.5 range)
salary = salary * (min + Math.random() * (max - min));
```
Higher ranks have higher promo multiplier ranges (bigger rewards at top).  
Lower ranks have smaller demotion multipliers (harsher salary cuts near the bottom).

### Multi-Lane Layout
- 3 lanes at Y positions: `[420, 520, 620]`
- Lane assignment: `Phaser.Utils.Array.Shuffle([0,0,1,1,2,2])` — ensures even distribution
- Racers rendered at `npc.y = LANE_Y[npc.lane]` each frame
- Depth: `setDepth(20 + lane)` so lane 2 (bottom/closest) renders on top

### NPC Speed Oscillation
```typescript
oscillationTimer += dt;
const wave = Math.sin((oscillationTimer / oscillationPeriod) * Math.PI * 2 + oscillationPhase);
const effectiveTarget = baseTierSpeed * (1 + wave * 0.1);  // ±10%
currentSpeed = lerp toward effectiveTarget
```
Each NPC has a different random `oscillationPeriod` (3–7s) and `oscillationPhase` (0–2π) so no two NPCs are ever perfectly in sync.

---

## Phaser 4 Specific Notes

1. **`generateTexture`** — call on a `Graphics` object: `g.generateTexture('key', width, height)`. The texture is stored in `this.textures` and accessible globally within the game by key.

2. **No Canvas renderer** — `Phaser.WEBGL` is the only viable option. `Phaser.AUTO` technically works but may fall back to Canvas in some environments; explicit WEBGL is safer.

3. **`setTintFill` removed** — use `sprite.setTint(color).setTintMode(Phaser.TintModes.FILL)` instead.

4. **`EventEmitter` import** — import from top-level `'phaser'`: `import { Events } from 'phaser'` then `new Events.EventEmitter()`. Sub-path imports don't resolve reliably with `moduleResolution: "bundler"`.

5. **Physics body cast** — after `scene.physics.add.existing(sprite)`, body is typed as union. Cast explicitly: `(this.body as Phaser.Physics.Arcade.Body).setVelocityX(v)`.

6. **`TileSprite.tilePositionX`** — incrementing this each frame scrolls the UV offset without moving the game object. No need to move the sprite itself.

7. **`Phaser.Utils.Array.Shuffle`** — mutates in place, returns the same array. Spread first to avoid mutating source: `Phaser.Utils.Array.Shuffle([...CHARACTERS])`.

8. **`this.time.delayedCall`** — use this instead of `setTimeout` for delayed scene transitions. It respects scene pause/resume and is automatically cleaned up when the scene stops.

9. **`setScrollFactor(0)`** — makes a game object fixed to the camera viewport regardless of camera scroll position. Essential for HUD elements.

10. **`noUnusedLocals` enforcement** — GameObjects returned by `this.add.*` that are never read again must still be assigned: use `_name` prefix or store as a class field even if never accessed.

---

## What To Do Differently Next Time

*(Filled in after implementation is complete)*

- [ ] Consider using a `Group` with `runChildUpdate: true` for projectiles instead of a manual `projectiles[]` array + loop
- [ ] A proper sprite atlas would improve rendering performance if character count grew
- [ ] NPC weapon targeting could be improved — currently picks nearest racer in screen space, not accounting for weapon speed vs. racer speed
- [ ] Lane-switching animations (smooth Y lerp between lanes) would make the multi-lane layout feel more dynamic
