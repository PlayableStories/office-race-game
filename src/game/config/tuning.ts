// All gameplay-feel tuning lives here.
// Forkers: change these freely. They are the difference between "skin" and "feel".
// Anything outside src/game/config/ is engine — change at your own risk.

import type { NPCTier } from '../objects/NPC';

// ─── Player ────────────────────────────────────────────────────────────────

export const PLAYER_TUNING = {
    pumpBoost: 80,             // speed added per alternating ←/→ press
    naturalDecel: 90,          // passive speed decay (px/s²) — stop pumping, slow down
    maxSpeed: 630,             // player ceiling
    laneChangeCooldownMs: 300, // anti-spam between ↑/↓ presses
    laneChangeLerpSpeed: 12,   // higher = snappier glide between lanes
} as const;

// ─── NPC ───────────────────────────────────────────────────────────────────

interface TierTuning {
    readonly base: number;     // cruise speed when not chasing/pacing
    readonly max: number;      // tier ceiling
    readonly paceGap: number;  // pre-overtake gap below player's live speed
}

export const NPC_TUNING = {
    tiers: {
        slow:   { base: 240, max: 260, paceGap: 200 },
        medium: { base: 310, max: 370, paceGap: 100 },
        fast:   { base: 385, max: 440, paceGap:  50 },
    } as Record<NPCTier, TierTuning>,

    paceDurationSec: 5,                          // ramp time into pace mode
    chaseDurationSec: 5,                         // ramp time into chase mode

    initialSpeedMultiplier: 0.3,                 // scale applied at spawn
    initialSpeedJitter: [0.5, 0.9] as const,     // extra random scaling band at spawn

    oscillationPeriodSecRange: [3, 7] as const,  // random wobble period
    oscillationAmplitude: 0.10,                  // ±fraction of base on the wobble

    acceleration: 150,
    deceleration: 200,
    naturalDecel: 60,

    chaseFlashIntervalMs: 220,
    chaseFlashColors: [0xff4444, 0xffee44] as const, // red ↔ yellow toggle
} as const;

// ─── Race orchestration ───────────────────────────────────────────────────

export const RACE_TUNING = {
    playerScreenX: 260,                       // x-coord where player is pinned
    laneY: [550, 620, 690] as const,          // 3 lane Y positions

    // The five NPCs, in order. Length here drives all other npc* arrays below.
    npcTiers: ['slow', 'medium', 'medium', 'fast', 'fast'] as const satisfies readonly NPCTier[],

    // Where NPCs sit pre-reveal (relative to player). Below — visible during the
    // pre-race grace window but quickly outpaced once pumping starts.
    npcPreRevealDistances: [-360, -200, -100, 160, 320] as const,

    // Where NPCs jump to when revealed (always ahead of player, ascending).
    npcSpawnOffsets: [800, 1600, 2400, 2600, 2800] as const,

    // After race start, how long before NPCs reveal (uniform random in [min, max]).
    npcRevealDelayMsRange: [3000, 5000] as const,

    chaseTargetOffset: 50,        // speed-above-player when an NPC enters chase
    pursuitNpcSpeedOffset: 50,    // speed-above-player for the post-fired pursuer
    pursuitNpcSpawnOffset: -700,  // x-offset behind player for the pursuer
    pursuitNpcTier: 'fast' as NPCTier,

    idleFireMs: 500,              // stand still this long after race-start → fired for slacking
} as const;
