import { Scene, Input } from 'phaser';

export class MainMenu extends Scene {
    private spaceKey!: Phaser.Input.Keyboard.Key;

    constructor() {
        super('MainMenu');
    }

    create(): void {
        // Background
        this.add.rectangle(512, 384, 1024, 768, 0x1a1a2e);

        // Decorative side strips
        this.add.rectangle(0, 384, 8, 768, 0xffdd00).setOrigin(0, 0.5);
        this.add.rectangle(1024, 384, 8, 768, 0xffdd00).setOrigin(1, 0.5);

        // Title
        this.add.text(512, 160, 'OFFICE CHAIR', {
            fontFamily: 'Arial Black',
            fontSize: '64px',
            color: '#ffdd00',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(512, 240, 'RACING CHAMPIONSHIP', {
            fontFamily: 'Arial Black',
            fontSize: '36px',
            color: '#ff6600',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Subtitle flavour
        this.add.text(512, 308, 'Climb the tech ladder at 30mph', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#aaaacc',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Divider
        this.add.rectangle(512, 338, 600, 2, 0x444466);

        // Career ladder preview
        const ranks = ['Junior Dev', 'Developer', 'Senior Dev', 'Tech Lead', 'VP Eng', 'CEO'];
        const rankColors = [0x888888, 0x66aaff, 0x66ffaa, 0xffdd00, 0xff8800, 0xff3300];
        for (let i = 0; i < ranks.length; i++) {
            const x = 162 + i * 140;
            this.add.text(x, 375, ranks[i], {
                fontFamily: 'Arial',
                fontSize: '13px',
                color: `#${rankColors[i].toString(16).padStart(6, '0')}`
            }).setOrigin(0.5);
            if (i < ranks.length - 1) {
                this.add.text(x + 70, 375, '→', {
                    fontFamily: 'Arial Black',
                    fontSize: '14px',
                    color: '#555577'
                }).setOrigin(0.5);
            }
        }

        // Press SPACE prompt with blink
        const prompt = this.add.text(512, 480, 'PRESS SPACE TO RACE', {
            fontFamily: 'Arial Black',
            fontSize: '30px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.tweens.add({
            targets: prompt,
            alpha: 0,
            duration: 550,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Controls legend
        this.add.text(512, 580, '←→ / AD  Pump Speed       ↑↓  Change Lane', {
            fontFamily: 'Arial',
            fontSize: '15px',
            color: '#888899'
        }).setOrigin(0.5);

        // Salary info
        this.add.text(512, 650, 'Pass rivals to earn promotions. Get passed to lose your post. Reach Junior Dev and you\'re FIRED!', {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#ff6644',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.spaceKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.SPACE);
    }

    update(): void {
        if (Input.Keyboard.JustDown(this.spaceKey)) {
            this.scene.start('Game');
        }
    }
}
