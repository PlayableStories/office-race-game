import { Scene } from 'phaser';
import { CHARACTERS } from '../config/characters';

function darkenColor(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 0xff) * factor);
    const g = Math.floor(((color >> 8) & 0xff) * factor);
    const b = Math.floor((color & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
}

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    create(): void {
        this.showLoadingText();
        this.generateAllTextures();
        this.scene.start('MainMenu');
    }

    private showLoadingText(): void {
        this.add.text(512, 384, 'Loading...', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    private generateAllTextures(): void {
        for (const char of CHARACTERS) {
            this.generateRacerTexture(char.textureKey, char.bodyColor, char.shirtColor, char.chairColor);
        }
        this.generateTrackTexture();
        this.generateUITextures();
    }

    // 60×80 racer sprite: chair back, seat, pole, wheels, torso, head, arms
    private generateRacerTexture(key: string, bodyColor: number, shirtColor: number, chairColor: number): void {
        const g = this.add.graphics();
        const seatColor = darkenColor(chairColor, 0.7);

        // Chair back
        g.fillStyle(chairColor);
        g.fillRoundedRect(20, 5, 20, 32, 4);

        // Seat
        g.fillStyle(seatColor);
        g.fillRoundedRect(12, 34, 36, 12, 3);

        // Center pole
        g.fillStyle(0x444444);
        g.fillRect(28, 46, 4, 14);

        // Wheels
        g.fillStyle(0x111111);
        g.fillCircle(14, 66, 5);
        g.fillCircle(30, 66, 5);
        g.fillCircle(46, 66, 5);

        // Torso
        g.fillStyle(shirtColor);
        g.fillRect(18, 16, 24, 26);

        // Head
        g.fillStyle(bodyColor);
        g.fillCircle(30, 10, 10);

        // Arms
        g.fillStyle(bodyColor);
        g.fillRect(10, 20, 8, 14);
        g.fillRect(42, 20, 8, 14);

        g.generateTexture(key, 60, 80);
        g.destroy();
    }

    private generateTrackTexture(): void {
        const g = this.add.graphics();
        const W = 256;
        const H = 768;

        // === Ceiling ===
        g.fillStyle(0xd4d0c8);
        g.fillRect(0, 0, W, 70);

        // Fluorescent light fixtures (frames + glow)
        g.fillStyle(0xb0aca0);
        g.fillRect(38, 52, 84, 2);
        g.fillRect(38, 66, 84, 2);
        g.fillRect(138, 52, 84, 2);
        g.fillRect(138, 66, 84, 2);
        g.fillStyle(0xfffff0);
        g.fillRect(40, 54, 80, 12);
        g.fillRect(140, 54, 80, 12);

        // Ceiling trim
        g.fillStyle(0xb8b4ac);
        g.fillRect(0, 68, W, 4);

        // === Wall ===
        g.fillStyle(0xe8e0d0);
        g.fillRect(0, 72, W, 440);

        // === Wall items ===

        // -- Potted plant (x 5–32, base on floor)
        // Pot
        g.fillStyle(0x9a5028);
        g.fillRect(8, 478, 22, 28);
        g.fillStyle(0x7a3818);
        g.fillRect(8, 478, 22, 4);
        // Foliage clusters
        g.fillStyle(0x4a7a3a);
        g.fillCircle(20, 462, 14);
        g.fillCircle(11, 446, 10);
        g.fillCircle(28, 446, 10);
        g.fillCircle(19, 432, 12);
        g.fillStyle(0x356528);
        g.fillCircle(15, 456, 7);
        g.fillCircle(24, 454, 7);
        g.fillCircle(19, 440, 6);

        // -- Bookshelf (x 38–95)
        // Outer wood frame
        g.fillStyle(0x4a2e18);
        g.fillRect(38, 282, 57, 224);
        // Inner shadow cavity
        g.fillStyle(0x2a1808);
        g.fillRect(41, 286, 51, 216);
        // Top trim
        g.fillStyle(0x6a3e22);
        g.fillRect(38, 282, 57, 4);
        // Shelf planks (3 internal, dividing into 4 rows)
        g.fillStyle(0x6a3e22);
        g.fillRect(41, 338, 51, 4);
        g.fillRect(41, 392, 51, 4);
        g.fillRect(41, 446, 51, 4);
        // Books on each shelf — deterministic colored vertical strips
        const bookColors = [0xcc4444, 0x4477cc, 0xddcc44, 0x44aa66, 0xaa44cc, 0xee8844, 0x44aacc, 0xbb6644];
        for (let row = 0; row < 4; row++) {
            const yTop = 290 + row * 54;
            const yBottom = yTop + 46;
            let bx = 43;
            let i = 0;
            while (bx < 91) {
                const bw = 5 + ((row * 7 + i * 3) % 5); // 5–9 px wide
                const bh = 36 + ((row * 5 + i * 7) % 8); // 36–43 px tall
                if (bx + bw > 91) break;
                g.fillStyle(bookColors[(row * 3 + i) % bookColors.length]);
                g.fillRect(bx, yBottom - bh, bw, bh);
                bx += bw + 1;
                i++;
            }
        }

        // -- Wall clock (x 117 ±18, y 150 ±18)
        g.fillStyle(0x222222);
        g.fillCircle(117, 150, 18);
        g.fillStyle(0xf5f0e0);
        g.fillCircle(117, 150, 15);
        // Tick marks at 12 / 3 / 6 / 9
        g.fillStyle(0x222222);
        g.fillRect(116, 138, 2, 3);
        g.fillRect(116, 159, 2, 3);
        g.fillRect(129, 149, 3, 2);
        g.fillRect(103, 149, 3, 2);
        // Hands
        g.lineStyle(2, 0x222222, 1);
        g.beginPath();
        g.moveTo(117, 150);
        g.lineTo(117, 138);
        g.moveTo(117, 150);
        g.lineTo(128, 152);
        g.strokePath();
        g.fillStyle(0x222222);
        g.fillCircle(117, 150, 2);

        // -- Small framed picture below clock (x 102–135, y 180–215)
        g.fillStyle(0x4a3018);
        g.fillRect(102, 178, 33, 38);
        g.fillStyle(0x6699aa);
        g.fillRect(105, 181, 27, 32);
        // Tiny landscape strokes
        g.fillStyle(0x88b0c0);
        g.fillRect(105, 181, 27, 12); // sky
        g.fillStyle(0x4a7a3a);
        g.fillRect(105, 200, 27, 13); // grass
        g.fillStyle(0xddcc88);
        g.fillRect(112, 198, 6, 4);   // sun shape

        // -- Window (x 145–207, y 130–262)
        // Window sill (wider, behind frame)
        g.fillStyle(0x6e4828);
        g.fillRect(140, 260, 72, 8);
        g.fillStyle(0x4a3018);
        g.fillRect(140, 268, 72, 3);
        // Outer wood frame
        g.fillStyle(0x8a6244);
        g.fillRect(145, 130, 62, 132);
        // Glass area
        g.fillStyle(0xa0c8e0);
        g.fillRect(149, 134, 54, 124);
        // Lighter sky band at top
        g.fillStyle(0xc0d8ec);
        g.fillRect(149, 134, 54, 28);
        // Clouds
        g.fillStyle(0xffffff);
        g.fillCircle(158, 148, 4);
        g.fillCircle(163, 147, 5);
        g.fillCircle(168, 148, 4);
        g.fillCircle(187, 142, 3);
        g.fillCircle(191, 141, 4);
        g.fillCircle(195, 142, 3);
        // Cross dividers (mullions)
        g.fillStyle(0x8a6244);
        g.fillRect(174, 134, 3, 124);
        g.fillRect(149, 194, 54, 3);

        // -- Desk + monitor (x 150–210, y 380–505)
        // Desk top
        g.fillStyle(0x6e4830);
        g.fillRect(150, 410, 60, 4);
        g.fillStyle(0x4a3018);
        g.fillRect(150, 414, 60, 8);
        // Drawer block (front-facing)
        g.fillStyle(0x3a2418);
        g.fillRect(154, 422, 52, 80);
        // Drawer separators
        g.fillStyle(0x2a1808);
        g.fillRect(154, 446, 52, 1);
        g.fillRect(154, 470, 52, 1);
        // Drawer handles (brass)
        g.fillStyle(0xddaa44);
        g.fillRect(175, 433, 10, 2);
        g.fillRect(175, 457, 10, 2);
        g.fillRect(175, 481, 10, 2);
        // CRT monitor on desk
        g.fillStyle(0x1a1a1a);
        g.fillRect(168, 378, 30, 32);
        g.fillStyle(0x3a5078);
        g.fillRect(170, 380, 26, 26);
        g.fillStyle(0x506888);
        g.fillRect(171, 381, 12, 11); // screen highlight
        // Tiny power LED
        g.fillStyle(0x66ff66);
        g.fillRect(194, 405, 2, 2);

        // -- Door (x 215–253, full height)
        // Door frame (slightly darker outer rim)
        g.fillStyle(0x6a4828);
        g.fillRect(213, 86, 42, 421);
        // Door slab
        g.fillStyle(0xc8a87a);
        g.fillRect(217, 90, 34, 413);
        // Two recessed panels
        g.fillStyle(0xa68458);
        g.fillRect(221, 106, 26, 160);
        g.fillRect(221, 280, 26, 160);
        // Panel inner shadows
        g.fillStyle(0x8a6840);
        g.fillRect(221, 106, 26, 2);
        g.fillRect(221, 264, 26, 2);
        g.fillRect(221, 280, 26, 2);
        g.fillRect(221, 438, 26, 2);
        // Door knob (brass) at mid-height, right side
        g.fillStyle(0x222222);
        g.fillCircle(246, 300, 3);
        g.fillStyle(0xddaa44);
        g.fillCircle(246, 300, 2);

        // === Wall baseboard ===
        g.fillStyle(0xc8bfaa);
        g.fillRect(0, 508, W, 8);

        // === Floor lanes (unchanged) ===
        const laneColors = [0x7a6548, 0x8b7355, 0x7a6548];
        const laneY = [516, 586, 656];
        for (let i = 0; i < 3; i++) {
            g.fillStyle(laneColors[i]);
            g.fillRect(0, laneY[i], W, 70);
        }

        // Lane dividers
        g.fillStyle(0xccaa66);
        g.fillRect(0, 514, W, 3);
        g.fillRect(0, 584, W, 3);
        g.fillRect(0, 654, W, 3);
        g.fillRect(0, 724, W, 3);

        // Floor edge shadow
        g.fillStyle(0x554433);
        g.fillRect(0, 724, W, 44);

        g.generateTexture('track_tile', W, H);
        g.destroy();
    }

    private generateUITextures(): void {
        const g = this.add.graphics();
        // Border via path API
        g.lineStyle(2, 0x888888, 0.8);
        g.beginPath();
        g.moveTo(8, 2);
        g.lineTo(40, 2);
        g.lineTo(46, 8);
        g.lineTo(46, 40);
        g.lineTo(40, 46);
        g.lineTo(8, 46);
        g.lineTo(2, 40);
        g.lineTo(2, 8);
        g.closePath();
        g.strokePath();
        g.generateTexture('ui_slot_empty', 48, 48);
        g.destroy();
    }
}
