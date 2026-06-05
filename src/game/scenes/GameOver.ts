import { Scene } from 'phaser';

type FireReason = 'demoted' | 'idle';

interface GameOverData {
    finalSalary: number;
    reason?: FireReason;
}

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    create(data: GameOverData): void {
        const salary = data?.finalSalary ?? 0;
        const reason: FireReason = data?.reason ?? 'demoted';

        const headline = reason === 'idle' ? 'SLACKING OFF!' : "YOU'RE FIRED!";
        const flavour = reason === 'idle'
            ? 'You stopped pumping mid-shift.\nManagement does not pay people to stand still.'
            : 'You got overtaken as a Junior Developer.\nYour access card has been revoked.';

        // Dark red background
        this.add.rectangle(512, 384, 1024, 768, 0x1a0000);

        // Decorative scanlines effect (alternating thin strips)
        for (let y = 0; y < 768; y += 6) {
            this.add.rectangle(512, y, 1024, 2, 0x000000, 0.12).setOrigin(0.5, 0);
        }

        // Headline
        this.add.text(512, 190, headline, {
            fontFamily: 'Arial Black',
            fontSize: '80px',
            color: '#ff3300',
            stroke: '#000000',
            strokeThickness: 12
        }).setOrigin(0.5);

        // Flavour text
        this.add.text(512, 310, flavour, {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#cc8888',
            align: 'center'
        }).setOrigin(0.5);

        // Divider
        this.add.rectangle(512, 380, 500, 2, 0x660000);

        // Final salary
        this.add.text(512, 420, 'Final Salary:', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#888888'
        }).setOrigin(0.5);

        this.add.text(512, 460, `$${Math.floor(salary).toLocaleString()}`, {
            fontFamily: 'Arial Black',
            fontSize: '48px',
            color: '#ffdd00',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Restart button
        const btn = this.add.text(512, 570, '[ TRY AGAIN ]', {
            fontFamily: 'Arial Black',
            fontSize: '30px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
            backgroundColor: '#440000',
            padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setColor('#ffdd00'));
        btn.on('pointerout', () => btn.setColor('#ffffff'));
        btn.on('pointerdown', () => this.scene.start('Game'));

        // Main menu button
        const menuBtn = this.add.text(512, 650, '[ MAIN MENU ]', {
            fontFamily: 'Arial Black',
            fontSize: '20px',
            color: '#888888',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setColor('#cccccc'));
        menuBtn.on('pointerout', () => menuBtn.setColor('#888888'));
        menuBtn.on('pointerdown', () => this.scene.start('MainMenu'));
    }
}
