export interface CharacterDef {
    readonly name: string;
    readonly bodyColor: number;
    readonly shirtColor: number;
    readonly chairColor: number;
    readonly textureKey: string;
}

export const CHARACTERS: CharacterDef[] = [
    { name: 'Gary',   bodyColor: 0xe8b89a, shirtColor: 0x2255aa, chairColor: 0x333355, textureKey: 'racer_gary'   },
    { name: 'Linda',  bodyColor: 0xf5cba7, shirtColor: 0xcc3366, chairColor: 0x442244, textureKey: 'racer_linda'  },
    { name: 'Raj',    bodyColor: 0xc68642, shirtColor: 0x116633, chairColor: 0x1a4a1a, textureKey: 'racer_raj'    },
    { name: 'Mei',    bodyColor: 0xf0c27f, shirtColor: 0xff6600, chairColor: 0x553300, textureKey: 'racer_mei'    },
    { name: 'Carlos', bodyColor: 0xa0522d, shirtColor: 0x8833aa, chairColor: 0x3d1a6e, textureKey: 'racer_carlos' },
    { name: 'Priya',  bodyColor: 0xd2956e, shirtColor: 0xff3344, chairColor: 0x6e1010, textureKey: 'racer_priya'  },
];
