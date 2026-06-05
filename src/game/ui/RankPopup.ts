import { Scene } from 'phaser';
import { RankChangeEvent } from '../systems/RaceManager';
import { RANKS } from '../config/ranks';

export class RankPopup {
    private readonly scene: Scene;
    private activeText: Phaser.GameObjects.Text | null = null;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    show(event: RankChangeEvent): void {
        if (this.activeText) {
            this.activeText.destroy();
            this.activeText = null;
        }

        const isPromo = event.direction === 'up';
        const rank = RANKS[event.rankIndex];
        const line1 = isPromo ? '🎉 PROMOTED!' : '📉 DEMOTED!';
        const line2 = rank.title.toUpperCase();

        const text = this.scene.add.text(512, 330, `${line1}\n${line2}`, {
            fontFamily: 'Arial Black',
            fontSize: '34px',
            color: isPromo ? '#00ff88' : '#ff4444',
            stroke: '#000000',
            strokeThickness: 7,
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);

        this.activeText = text;

        // Fly in
        this.scene.tweens.add({
            targets: text,
            alpha: 1,
            y: 290,
            duration: 260,
            ease: 'Back.Out',
            onComplete: () => {
                // Fly out after hold
                this.scene.tweens.add({
                    targets: text,
                    alpha: 0,
                    y: 255,
                    delay: 1100,
                    duration: 350,
                    ease: 'Sine.In',
                    onComplete: () => {
                        text.destroy();
                        if (this.activeText === text) this.activeText = null;
                    }
                });
            }
        });
    }
}
