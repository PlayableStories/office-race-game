import { Scene, Utils, Physics } from 'phaser';
import { CHARACTERS } from '../config/characters';
import { RANKS } from '../config/ranks';
import { PLAYER_TUNING, RACE_TUNING } from '../config/tuning';
import { Player } from '../objects/Player';
import { NPC } from '../objects/NPC';
import { Racer } from '../objects/Racer';
import { RaceManager, RankChangeEvent, PlayerOvertakeNPCEvent } from '../systems/RaceManager';
import { HUD } from '../ui/HUD';
import { RankPopup } from '../ui/RankPopup';

const { playerScreenX: PLAYER_SCREEN_X, laneY: LANE_Y, npcTiers: NPC_TIERS } = RACE_TUNING;

interface GameOverData {
    finalSalary: number;
}

export class Game extends Scene {
    private player!: Player;
    private npcs!: NPC[];
    private allRacers!: Racer[];

    private raceManager!: RaceManager;
    private hud!: HUD;
    private rankPopup!: RankPopup;

    private background!: Phaser.GameObjects.TileSprite;
    private nameLabels!: Map<Racer, Phaser.GameObjects.Text>;
    private startPrompt!: Phaser.GameObjects.Text;
    private playerArrow!: Phaser.GameObjects.Text;
    private playerYouLabel!: Phaser.GameObjects.Text;
    private isGameOver: boolean = false;
    private raceStarted: boolean = false;
    private npcsSpawned: boolean = false;
    private raceTimer: number = 0;
    private npcSpawnDelay: number = 0;
    private prevSalary: number = 0;
    private idleStopTimer: number = 0;

    constructor() {
        super('Game');
    }

    create(): void {
        this.isGameOver = false;
        this.raceStarted = false;
        this.npcsSpawned = false;
        this.raceTimer = 0;
        const [revealMin, revealMax] = RACE_TUNING.npcRevealDelayMsRange;
        this.npcSpawnDelay = revealMin + Math.random() * (revealMax - revealMin);
        this.idleStopTimer = 0;
        this.nameLabels = new Map();

        // Background — tileable office corridor
        this.background = this.add.tileSprite(0, 0, 1024, 768, 'track_tile')
            .setOrigin(0, 0)
            .setDepth(0);

        // Assign characters randomly
        const shuffledChars = Utils.Array.Shuffle([...CHARACTERS]);
        const playerChar = shuffledChars[0];
        const npcChars = shuffledChars.slice(1);

        // Assign 2 racers per lane: shuffle [0,0,1,1,2,2]
        const laneAssignments = Utils.Array.Shuffle([0, 0, 1, 1, 2, 2]);
        const playerLane = laneAssignments[0];

        // Create player
        this.player = new Player({
            scene: this,
            x: PLAYER_SCREEN_X,
            y: LANE_Y[playerLane],
            textureKey: playerChar.textureKey,
            name: playerChar.name,
            lane: playerLane,
        });
        this.player.setDepth(20 + playerLane);
        this.prevSalary = RANKS[0].baseSalary;

        // Spread NPCs around the player (player starts at raceDistance 0).
        // None starts at 0 — even a tiny gap avoids an overtake on the very first frame
        // before the player can press a key.
        this.npcs = npcChars.map((char, i) => {
            const tier = NPC_TIERS[i];
            const lane = laneAssignments[i + 1];
            const startDistance = RACE_TUNING.npcPreRevealDistances[i];

            const npc = new NPC({
                scene: this,
                x: PLAYER_SCREEN_X + startDistance,
                y: LANE_Y[lane],
                textureKey: char.textureKey,
                name: char.name,
                lane,
                tier,
            });
            npc.raceDistance = startDistance;
            npc.setDepth(20 + lane);
            npc.setVisible(false);
            return npc;
        });

        this.allRacers = [this.player, ...this.npcs];

        // Systems
        this.raceManager = new RaceManager(this.player, this.allRacers);
        this.hud = new HUD(this);
        this.rankPopup = new RankPopup(this);

        // Wire events
        this.raceManager.events.on('rank-change', (evt: RankChangeEvent) => {
            this.rankPopup.show(evt);
            const salaryDiff = evt.salary - this.prevSalary;
            this.hud.flashSalaryChange(this, salaryDiff, evt.direction);
            this.prevSalary = evt.salary;
            if (evt.direction === 'down' && evt.rankIndex === 0) this.spawnPursuitNPC();
        });

        this.raceManager.events.on('player-overtake-npc', (evt: PlayerOvertakeNPCEvent) => {
            const npc = evt.npc as NPC;
            npc.startChase(this.player.currentSpeed + RACE_TUNING.chaseTargetOffset);
            this.nameLabels.get(npc)?.setText('AI').setColor('#ff4444');
        });

        this.raceManager.events.on('game-over', (evt: GameOverData) => {
            this.triggerGameOver(evt.finalSalary);
        });

        // Name labels
        for (const racer of this.allRacers) {
            const isPlayer = racer === this.player;
            const label = this.add.text(racer.x, racer.y - 52, racer.racerName, {
                fontFamily: 'Arial Black',
                fontSize: '20px',
                color: isPlayer ? '#ffdd00' : '#ffffff',
                stroke: '#000000',
                strokeThickness: 5
            }).setOrigin(0.5, 1).setDepth(30).setScrollFactor(1).setVisible(isPlayer);
            this.nameLabels.set(racer, label);
        }

        // Player indicator arrow
        this.playerArrow = this.add.text(PLAYER_SCREEN_X, LANE_Y[playerLane] - 80, '▼', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffdd00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(31);

        // "YOU" label
        this.playerYouLabel = this.add.text(PLAYER_SCREEN_X, LANE_Y[playerLane] - 100, 'YOU', {
            fontFamily: 'Arial Black',
            fontSize: '13px',
            color: '#ffdd00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(31);

        // Start prompt — fades out when player first accelerates
        this.startPrompt = this.add.text(512, 384, 'Alternate  ←→  to race!', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        this.tweens.add({
            targets: this.startPrompt,
            alpha: 0.3,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    update(_time: number, delta: number): void {
        if (this.isGameOver) return;

        // 1. Update all racer logic
        this.player.updateRacer(delta);

        if (!this.raceStarted && this.player.currentSpeed > 0) {
            this.raceStarted = true;
            this.tweens.killTweensOf(this.startPrompt);
            this.tweens.add({
                targets: this.startPrompt,
                alpha: 0,
                duration: 400,
                onComplete: () => { this.startPrompt.destroy(); }
            });
        }

        if (this.raceStarted && !this.npcsSpawned) {
            this.raceTimer += delta;
            if (this.raceTimer >= this.npcSpawnDelay) {
                this.spawnNPCs();
            }
        }

        // Slacking off — fired for stopping mid-shift
        if (this.raceStarted) {
            if (this.player.currentSpeed <= 0.5) {
                this.idleStopTimer += delta;
                if (this.idleStopTimer >= RACE_TUNING.idleFireMs) {
                    this.triggerGameOver(this.raceManager.currentSalary, 'idle');
                    return;
                }
            } else {
                this.idleStopTimer = 0;
            }
        }

        if (this.npcsSpawned) {
            const playerSpeed = this.player.currentSpeed;
            for (const npc of this.npcs) {
                npc.updatePaceTarget(playerSpeed);
                npc.updateRacer(delta);
            }
        }

        // 2. Position racers on screen relative to player's race distance
        this.player.x = PLAYER_SCREEN_X;
        const targetPlayerY = LANE_Y[this.player.lane];
        this.player.y += (targetPlayerY - this.player.y)
            * Math.min(1, PLAYER_TUNING.laneChangeLerpSpeed * delta / 1000);

        for (const npc of this.npcs) {
            npc.x = PLAYER_SCREEN_X + (npc.raceDistance - this.player.raceDistance);
            npc.y = LANE_Y[npc.lane];
        }

        // 3. Scroll background
        this.background.tilePositionX += this.player.currentSpeed * (delta / 1000);

        // 4. Update systems
        if (this.npcsSpawned) this.raceManager.update(delta);

        // 5. Update HUD
        this.hud.update(
            this.raceManager.currentRankIndex,
            this.raceManager.currentSalary,
            this.raceManager.playerPosition
        );

        // 6. Update name label positions
        for (const [racer, label] of this.nameLabels) {
            label.setPosition(racer.x, racer.y - 52);
        }

        // 7. Keep the "YOU" indicator stuck to the player
        this.playerArrow.y = this.player.y - 80;
        this.playerYouLabel.y = this.player.y - 100;
    }

    private spawnPursuitNPC(): void {
        const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        const lane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
        const spawnOffset = RACE_TUNING.pursuitNpcSpawnOffset;

        const npc = new NPC({
            scene: this,
            x: PLAYER_SCREEN_X + spawnOffset,
            y: LANE_Y[lane],
            textureKey: char.textureKey,
            name: char.name,
            lane,
            tier: RACE_TUNING.pursuitNpcTier,
        });
        npc.raceDistance = this.player.raceDistance + spawnOffset;
        npc.startChase(this.player.currentSpeed + RACE_TUNING.pursuitNpcSpeedOffset, true);
        npc.setDepth(20 + lane);

        this.npcs.push(npc);
        this.allRacers.push(npc);
        this.raceManager.resync();

        const label = this.add.text(npc.x, npc.y - 52, 'AI', {
            fontFamily: 'Arial Black',
            fontSize: '20px',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5, 1).setDepth(30).setScrollFactor(1);
        this.nameLabels.set(npc, label);
    }

    private spawnNPCs(): void {
        // Position all NPCs off-screen ahead of the player and reveal them
        const offsets = RACE_TUNING.npcSpawnOffsets;
        for (let i = 0; i < this.npcs.length; i++) {
            const npc = this.npcs[i];
            npc.raceDistance = this.player.raceDistance + offsets[i];
            npc.x = PLAYER_SCREEN_X + offsets[i];
            npc.y = LANE_Y[npc.lane];
            npc.setVisible(true);
            npc.startPaceMode();
            const label = this.nameLabels.get(npc);
            if (label) {
                label.setPosition(npc.x, npc.y - 52);
                label.setVisible(true);
            }
        }
        this.raceManager.resync();
        this.npcsSpawned = true;
    }

    private triggerGameOver(finalSalary: number, reason: 'demoted' | 'idle' = 'demoted'): void {
        this.isGameOver = true;
        this.player.currentSpeed = 0;
        this.player.isHalted = true;
        (this.player.body as Physics.Arcade.Body).setVelocityX(0);

        const bannerText = reason === 'idle' ? "SLACKING OFF!" : "YOU'RE FIRED!";

        // Flash red overlay
        const overlay = this.add.rectangle(512, 384, 1024, 768, 0xff0000, 0)
            .setScrollFactor(0).setDepth(300);

        this.tweens.add({
            targets: overlay,
            alpha: 0.35,
            duration: 300,
            yoyo: true,
            repeat: 2,
        });

        // Fired banner
        const firedText = this.add.text(512, 320, bannerText, {
            fontFamily: 'Arial Black',
            fontSize: '72px',
            color: '#ff3300',
            stroke: '#000000',
            strokeThickness: 12
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setAlpha(0);

        this.tweens.add({
            targets: firedText,
            alpha: 1,
            y: 300,
            duration: 400,
            ease: 'Back.Out',
        });

        const salaryText = this.add.text(512, 400, `Final Salary: $${Math.floor(finalSalary).toLocaleString()}`, {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#ffdd00',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setAlpha(0);

        this.tweens.add({
            targets: salaryText,
            alpha: 1,
            delay: 400,
            duration: 300,
        });

        this.time.delayedCall(2800, () => {
            this.scene.start('GameOver', { finalSalary, reason });
        });
    }
}
