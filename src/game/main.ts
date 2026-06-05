import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { WEBGL, Game as PhaserGame, Scale, Types } from 'phaser';

const config: Types.Core.GameConfig = {
    type: WEBGL,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [Boot, Preloader, MainMenu, Game, GameOver]
};

const StartGame = (parent: string) => {
    return new PhaserGame({ ...config, parent });
};

export default StartGame;
