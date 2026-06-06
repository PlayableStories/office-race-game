import { Racer, RacerConfig } from './Racer';
import { NPC_TUNING } from '../config/tuning';

export type NPCTier = 'slow' | 'medium' | 'fast';

export interface NPCConfig extends RacerConfig {
    tier: NPCTier;
}

export class NPC extends Racer {
    readonly tier: NPCTier;
    private readonly baseTierSpeed: number;

    private oscillationTimer: number = 0;
    private readonly oscillationPeriod: number;
    private readonly oscillationPhase: number;

    speedMultiplier: number = NPC_TUNING.initialSpeedMultiplier;

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
    override acceleration = NPC_TUNING.acceleration;
    override deceleration = NPC_TUNING.deceleration;
    override naturalDecel = NPC_TUNING.naturalDecel;

    constructor(config: NPCConfig) {
        super(config);
        this.tier = config.tier;
        this.baseTierSpeed = NPC_TUNING.tiers[config.tier].base;
        this.maxSpeed = NPC_TUNING.tiers[config.tier].max;
        const [oscMin, oscMax] = NPC_TUNING.oscillationPeriodSecRange;
        this.oscillationPeriod = oscMin + Math.random() * (oscMax - oscMin);
        this.oscillationPhase = Math.random() * Math.PI * 2;
        const [jitMin, jitMax] = NPC_TUNING.initialSpeedJitter;
        this.currentSpeed = this.baseTierSpeed * this.speedMultiplier
            * (jitMin + Math.random() * (jitMax - jitMin));
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
        this.paceTargetSpeed = Math.max(
            this.paceStartSpeed,
            playerSpeed - NPC_TUNING.tiers[this.tier].paceGap
        );
    }

    private enableChaseFlash(): void {
        if (this.flashEvent) return;
        const [colorA, colorB] = NPC_TUNING.chaseFlashColors;
        let on = false;
        this.flashEvent = this.scene.time.addEvent({
            delay: NPC_TUNING.chaseFlashIntervalMs,
            loop: true,
            callback: () => {
                on = !on;
                this.setTint(on ? colorA : colorB);
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
                this.chaseProgress = Math.min(1, this.chaseProgress + dt / NPC_TUNING.chaseDurationSec);
            }
            this.currentSpeed = this.chaseStartSpeed
                + (this.chaseTargetSpeed - this.chaseStartSpeed) * this.chaseProgress;
            super.updateRacer(delta);
            return;
        }

        if (this.inPaceMode) {
            if (this.paceProgress < 1) {
                this.paceProgress = Math.min(1, this.paceProgress + dt / NPC_TUNING.paceDurationSec);
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
        const effectiveTarget = this.baseTierSpeed * this.speedMultiplier
            * (1 + wave * NPC_TUNING.oscillationAmplitude);

        if (this.currentSpeed < effectiveTarget) {
            this.currentSpeed = Math.min(effectiveTarget, this.currentSpeed + this.acceleration * dt);
        } else {
            this.currentSpeed = Math.max(effectiveTarget, this.currentSpeed - this.deceleration * dt);
        }

        super.updateRacer(delta);
    }
}
