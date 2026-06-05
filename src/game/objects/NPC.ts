import { Racer, RacerConfig } from './Racer';

export type NPCTier = 'slow' | 'medium' | 'fast';

export interface NPCConfig extends RacerConfig {
    tier: NPCTier;
}

const TIER_BASE: Record<NPCTier, number> = {
    slow: 240,
    medium: 310,
    fast: 385,
};

const TIER_MAX: Record<NPCTier, number> = {
    slow: 260,
    medium: 370,
    fast: 440,
};

// How far below the player's live speed each tier paces, pre-CEO.
// Smaller = harder to overtake (closer to player).
const TIER_PACE_GAP: Record<NPCTier, number> = {
    slow: 200,
    medium: 100,
    fast: 50,
};

const CHASE_DURATION_SEC = 5;
const PACE_DURATION_SEC = 5;

export class NPC extends Racer {
    readonly tier: NPCTier;
    private readonly baseTierSpeed: number;

    private oscillationTimer: number = 0;
    private readonly oscillationPeriod: number;
    private readonly oscillationPhase: number;

    speedMultiplier: number = 0.3;

    private inChaseMode: boolean = false;
    private chaseStartSpeed: number = 0;
    private chaseTargetSpeed: number = 0;
    private chaseProgress: number = 0;
    private flashEvent?: Phaser.Time.TimerEvent;

    private inPaceMode: boolean = false;
    private paceStartSpeed: number = 0;
    private paceTargetSpeed: number = 0;
    private paceProgress: number = 0;

    override maxSpeed: number;
    override acceleration = 150;
    override deceleration = 200;
    override naturalDecel = 60;

    constructor(config: NPCConfig) {
        super(config);
        this.tier = config.tier;
        this.baseTierSpeed = TIER_BASE[config.tier];
        this.maxSpeed = TIER_MAX[config.tier];
        this.oscillationPeriod = 3 + Math.random() * 4;
        this.oscillationPhase = Math.random() * Math.PI * 2;
        this.currentSpeed = this.baseTierSpeed * this.speedMultiplier * (0.5 + Math.random() * 0.4);
    }

    startChase(targetSpeed: number, instant: boolean = false): void {
        this.inChaseMode = true;
        if (instant) {
            this.chaseStartSpeed = targetSpeed;
            this.chaseTargetSpeed = targetSpeed;
            this.chaseProgress = 1;
            this.currentSpeed = targetSpeed;
        } else {
            this.chaseStartSpeed = this.currentSpeed;
            this.chaseTargetSpeed = targetSpeed;
            this.chaseProgress = 0;
        }
        this.enableChaseFlash();
    }

    startPaceMode(): void {
        if (this.inPaceMode) return;
        this.inPaceMode = true;
        this.paceStartSpeed = this.currentSpeed;
        this.paceTargetSpeed = this.currentSpeed;
        this.paceProgress = 0;
    }

    updatePaceTarget(playerSpeed: number): void {
        this.paceTargetSpeed = Math.max(this.paceStartSpeed, playerSpeed - TIER_PACE_GAP[this.tier]);
    }

    private enableChaseFlash(): void {
        if (this.flashEvent) return;
        let on = false;
        this.flashEvent = this.scene.time.addEvent({
            delay: 220,
            loop: true,
            callback: () => {
                on = !on;
                this.setTint(on ? 0xff4444 : 0xffee44);
            }
        });
    }

    override updateRacer(delta: number): void {
        if (this.isHalted) {
            this.updateHalt(delta);
            return;
        }

        const dt = delta / 1000;

        if (this.inChaseMode) {
            if (this.chaseProgress < 1) {
                this.chaseProgress = Math.min(1, this.chaseProgress + dt / CHASE_DURATION_SEC);
            }
            this.currentSpeed = this.chaseStartSpeed
                + (this.chaseTargetSpeed - this.chaseStartSpeed) * this.chaseProgress;
            super.updateRacer(delta);
            return;
        }

        if (this.inPaceMode) {
            if (this.paceProgress < 1) {
                this.paceProgress = Math.min(1, this.paceProgress + dt / PACE_DURATION_SEC);
            }
            this.currentSpeed = this.paceStartSpeed
                + (this.paceTargetSpeed - this.paceStartSpeed) * this.paceProgress;
            super.updateRacer(delta);
            return;
        }

        this.oscillationTimer += dt;
        const wave = Math.sin(
            (this.oscillationTimer / this.oscillationPeriod) * Math.PI * 2 + this.oscillationPhase
        );
        const effectiveTarget = this.baseTierSpeed * this.speedMultiplier * (1 + wave * 0.10);

        if (this.currentSpeed < effectiveTarget) {
            this.currentSpeed = Math.min(effectiveTarget, this.currentSpeed + this.acceleration * dt);
        } else {
            this.currentSpeed = Math.max(effectiveTarget, this.currentSpeed - this.deceleration * dt);
        }

        super.updateRacer(delta);
    }
}
