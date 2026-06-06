import { Input } from 'phaser';
import { Racer, RacerConfig } from './Racer';
import { PLAYER_TUNING } from '../config/tuning';

export class Player extends Racer {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private aKey!: Phaser.Input.Keyboard.Key;
    private dKey!: Phaser.Input.Keyboard.Key;

    private laneChangeCooldown: number = 0;
    private lastKeyPressed: 'left' | 'right' | null = null;
    private readonly pumpBoost = PLAYER_TUNING.pumpBoost;

    override maxSpeed = PLAYER_TUNING.maxSpeed;
    override naturalDecel = PLAYER_TUNING.naturalDecel;

    constructor(config: RacerConfig) {
        super(config);
        this.cursors = this.scene.input.keyboard!.createCursorKeys();
        this.aKey = this.scene.input.keyboard!.addKey(Input.Keyboard.KeyCodes.A);
        this.dKey = this.scene.input.keyboard!.addKey(Input.Keyboard.KeyCodes.D);
    }

    override updateRacer(delta: number): void {
        // Lane change — allowed even while halted so player can still dodge
        this.laneChangeCooldown -= delta;
        if (this.laneChangeCooldown <= 0) {
            if (Input.Keyboard.JustDown(this.cursors.up) && this.lane > 0) {
                this.lane--;
                this.laneChangeCooldown = PLAYER_TUNING.laneChangeCooldownMs;
            } else if (Input.Keyboard.JustDown(this.cursors.down) && this.lane < 2) {
                this.lane++;
                this.laneChangeCooldown = PLAYER_TUNING.laneChangeCooldownMs;
            }
        }

        if (this.isHalted) {
            this.updateHalt(delta);
            return;
        }

        const dt = delta / 1000;

        // Constant natural deceleration — must keep pumping to maintain speed
        this.currentSpeed = Math.max(0, this.currentSpeed - this.naturalDecel * dt);

        // Alternate left/right (or A/D) to pump speed
        const leftJust = Input.Keyboard.JustDown(this.cursors.left) || Input.Keyboard.JustDown(this.aKey);
        const rightJust = Input.Keyboard.JustDown(this.cursors.right) || Input.Keyboard.JustDown(this.dKey);

        if (leftJust && this.lastKeyPressed !== 'left') {
            this.lastKeyPressed = 'left';
            this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + this.pumpBoost);
        } else if (rightJust && this.lastKeyPressed !== 'right') {
            this.lastKeyPressed = 'right';
            this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + this.pumpBoost);
        }

        super.updateRacer(delta);
    }
}
