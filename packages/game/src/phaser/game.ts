import Phaser from 'phaser';
import { BoardScene } from './scenes/BoardScene';

export const createGameConfig = (parent: string | HTMLElement, width: number, height: number): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.AUTO,
    parent: parent,
    width: width,
    height: height,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    transparent: true, // Allow Seeing React Background if needed, or blending
    scene: [BoardScene],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
  };
};
