import { Physics, Scene } from 'phaser';

export interface RacerConfig {
    scene: Scene;
    x: number;
    y: number;
    textureKey: string;
    name: string;
    lane: number;
}

export class Racer extends Physics.Arcade.Sprite {
    readonly racerName: string;
    lane: number;

    raceDistance: number = 0;
    currentSpeed: number = 0;
    racePosition: number = 1;
    isHalted: boolean = false;
    haltTimer: number = 0;

    maxSpeed: number = 400;
    acceleration: number = 180;
    deceleration: number = 220;
    naturalDecel: number = 80;

    constructor(config: RacerConfig) {
        super(config.scene, config.x, config.y, config.textureKey);
        this.racerName = config.name;
        this.lane = config.lane;

        config.scene.add.existing(this);
        config.scene.physics.add.existing(this);

        this.setOrigin(0.5, 0.8);
        (this.body as Physics.Arcade.Body).setGravityY(0);
        (this.body as Physics.Arcade.Body).setCollideWorldBounds(false);
    }

    halt(duration: number): void {
        if (this.isHalted) {
            this.haltTimer = Math.max(this.haltTimer, duration);
            return;
        }
        this.isHalted = true;
        this.haltTimer = duration;
        this.currentSpeed = 0;
        (this.body as Physics.Arcade.Body).setVelocityX(0);
    }

    updateHalt(delta: number): void {
        if (!this.isHalted) return;
        this.haltTimer -= delta / 1000;
        if (this.haltTimer <= 0) {
            this.isHalted = false;
            this.haltTimer = 0;
        }
    }

    updateRacer(delta: number): void {
        this.raceDistance += this.currentSpeed * (delta / 1000);
    }
}
