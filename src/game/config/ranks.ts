export interface RankDef {
    readonly index: number;
    readonly title: string;
    readonly baseSalary: number;
    readonly promoteMultRange: [number, number];
    readonly demoteMultRange: [number, number];
}

export const RANKS: RankDef[] = [
    { index: 0, title: 'Junior Developer', baseSalary: 1_000,   promoteMultRange: [2.0, 3.5],  demoteMultRange: [0.1,  0.2 ] },
    { index: 1, title: 'Developer',        baseSalary: 5_000,   promoteMultRange: [2.5, 5.0],  demoteMultRange: [0.15, 0.25] },
    { index: 2, title: 'Senior Developer', baseSalary: 15_000,  promoteMultRange: [3.0, 6.5],  demoteMultRange: [0.2,  0.35] },
    { index: 3, title: 'Tech Lead',        baseSalary: 35_000,  promoteMultRange: [4.5, 8.0],  demoteMultRange: [0.3,  0.45] },
    { index: 4, title: 'VP Engineering',   baseSalary: 75_000,  promoteMultRange: [7.0, 10.0], demoteMultRange: [0.4,  0.5 ] },
    { index: 5, title: 'CEO',              baseSalary: 150_000, promoteMultRange: [7.0, 10.0], demoteMultRange: [0.4,  0.5 ] },
];

export const STARTING_RANK = 0;
export const MAX_RANK = 5;

export function getPromoteMultiplier(toRankIndex: number): number {
    const [min, max] = RANKS[toRankIndex].promoteMultRange;
    return min + Math.random() * (max - min);
}

export function getDemoteMultiplier(fromRankIndex: number): number {
    const [min, max] = RANKS[fromRankIndex].demoteMultRange;
    return min + Math.random() * (max - min);
}
