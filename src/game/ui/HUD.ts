import { Scene } from 'phaser';
import { RANKS } from '../config/ranks';

export class HUD {
    private readonly rankText: Phaser.GameObjects.Text;
    private readonly positionText: Phaser.GameObjects.Text;
    private readonly salaryChangeText: Phaser.GameObjects.Text;
    private salaryChangeTween: Phaser.Tweens.Tween | null = null;

    constructor(scene: Scene) {
        // Background panel — top left
        scene.add.rectangle(0, 0, 340, 52, 0x000000, 0.55)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(99);

        // Rank + salary
        this.rankText = scene.add.text(12, 10, 'Junior Developer  |  $1,000', {
            fontFamily: 'Arial Black',
            fontSize: '20px',
            color: '#ffdd00',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(100);

        // Background panel — top right
        scene.add.rectangle(1024, 0, 200, 52, 0x000000, 0.55)
            .setOrigin(1, 0).setScrollFactor(0).setDepth(99);

        // Race position
        this.positionText = scene.add.text(1012, 10, '1st / 6', {
            fontFamily: 'Arial Black',
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

        // Floating salary change indicator (centre-right)
        this.salaryChangeText = scene.add.text(860, 120, '', {
            fontFamily: 'Arial Black',
            fontSize: '22px',
            color: '#00ff88',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0);
    }

    update(rankIndex: number, salary: number, position: number): void {
        const rank = RANKS[rankIndex];
        this.rankText.setText(`${rank.title}  |  $${Math.floor(salary).toLocaleString()}`);

        const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
        this.positionText.setText(`${ordinals[position - 1]} / 6`);
    }

    flashSalaryChange(scene: Scene, amount: number, direction: 'up' | 'down'): void {
        if (this.salaryChangeTween) {
            this.salaryChangeTween.stop();
        }

        const isUp = direction === 'up';
        const prefix = isUp ? '▲ +$' : '▼ -$';
        const color = isUp ? '#00ff88' : '#ff4444';
        this.salaryChangeText
            .setText(`${prefix}${Math.floor(Math.abs(amount)).toLocaleString()}`)
            .setColor(color)
            .setAlpha(1)
            .setY(120);

        this.salaryChangeTween = scene.tweens.add({
            targets: this.salaryChangeText,
            alpha: 0,
            y: 80,
            duration: 1600,
            ease: 'Sine.Out',
            delay: 600
        });
    }
}
