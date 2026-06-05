import { Events } from 'phaser';
import { Racer } from '../objects/Racer';
import { Player } from '../objects/Player';
import { RANKS, MAX_RANK, STARTING_RANK, getPromoteMultiplier, getDemoteMultiplier } from '../config/ranks';

export interface RankChangeEvent {
    direction: 'up' | 'down';
    rankIndex: number;
    salary: number;
    rankTitle: string;
}

export interface GameOverEvent {
    finalSalary: number;
}

export interface PlayerOvertakeNPCEvent {
    npc: Racer;
}

export class RaceManager {
    readonly events: Events.EventEmitter;

    private readonly player: Player;
    private readonly allRacers: Racer[];
    private readonly previousPositions: Map<Racer, number>;

    private rankIndex: number = STARTING_RANK;
    private salary: number;
    private done: boolean = false;
    private firstFrame: boolean = true; // skip overtake detection on frame 1

    constructor(player: Player, allRacers: Racer[]) {
        this.events = new Events.EventEmitter();
        this.player = player;
        this.allRacers = allRacers;
        this.salary = RANKS[STARTING_RANK].baseSalary;
        this.previousPositions = new Map();
        // Initialise positions from actual starting race distances so the first
        // update() frame sees no change and fires no false overtakes.
        const sorted = [...allRacers].sort((a, b) => b.raceDistance - a.raceDistance);
        sorted.forEach((r, i) => {
            r.racePosition = i + 1;
            this.previousPositions.set(r, i + 1);
        });
    }

    resync(): void {
        const sorted = [...this.allRacers].sort((a, b) => b.raceDistance - a.raceDistance);
        sorted.forEach((r, i) => {
            r.racePosition = i + 1;
            this.previousPositions.set(r, i + 1);
        });
        this.firstFrame = true;
    }

    get currentRankIndex(): number { return this.rankIndex; }
    get currentRankTitle(): string { return RANKS[this.rankIndex].title; }
    get currentSalary(): number { return this.salary; }
    get playerPosition(): number { return this.player.racePosition; }

    update(_delta: number): void {
        if (this.done) return;

        // Sort by race distance descending → assign positions
        const sorted = [...this.allRacers].sort((a, b) => b.raceDistance - a.raceDistance);
        sorted.forEach((r, i) => { r.racePosition = i + 1; });

        // Frame 1: sync previousPositions to post-first-movement state, then return.
        // Avoids false overtakes from the gap between constructor-time distances and
        // the first frame's distances (NPCs have non-zero initial speed).
        if (this.firstFrame) {
            this.firstFrame = false;
            for (const r of this.allRacers) {
                this.previousPositions.set(r, r.racePosition);
            }
            return;
        }

        // Detect overtakes by comparing new positions to previous frame
        for (const racer of this.allRacers) {
            const prevPos = this.previousPositions.get(racer) ?? racer.racePosition;
            const currPos = racer.racePosition;

            if (currPos < prevPos) {
                // Racer improved — find who they passed
                for (const other of this.allRacers) {
                    if (other === racer) continue;
                    const otherPrev = this.previousPositions.get(other) ?? other.racePosition;
                    if (prevPos > otherPrev && currPos <= other.racePosition) {
                        this.handleOvertake(racer, other);
                        if (this.done) return;
                    }
                }
            }
        }

        // Save positions for next frame
        for (const r of this.allRacers) {
            this.previousPositions.set(r, r.racePosition);
        }
    }

    private handleOvertake(passer: Racer, passee: Racer): void {
        const playerPasses = passer === this.player;
        const playerIsPassed = passee === this.player;

        if (playerPasses) {
            this.events.emit('player-overtake-npc', { npc: passee } satisfies PlayerOvertakeNPCEvent);
            if (this.rankIndex < MAX_RANK) {
                this.rankIndex++;
                this.salary = this.salary * getPromoteMultiplier(this.rankIndex);
                this.events.emit('rank-change', {
                    direction: 'up',
                    rankIndex: this.rankIndex,
                    salary: this.salary,
                    rankTitle: RANKS[this.rankIndex].title,
                } satisfies RankChangeEvent);
            }
        } else if (playerIsPassed) {
            if (this.rankIndex === 0) {
                this.done = true;
                this.salary = 0;
                this.events.emit('game-over', { finalSalary: 0 } satisfies GameOverEvent);
            } else {
                this.salary = this.salary * getDemoteMultiplier(this.rankIndex);
                this.rankIndex--;
                this.events.emit('rank-change', {
                    direction: 'down',
                    rankIndex: this.rankIndex,
                    salary: this.salary,
                    rankTitle: RANKS[this.rankIndex].title,
                } satisfies RankChangeEvent);
            }
        }
    }
}
