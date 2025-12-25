import Phaser from 'phaser';
import { BoardScene } from './scenes/BoardScene';

export const createGameConfig = (parent: string | HTMLElement, width: number, height: number): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.WEBGL,
    parent: parent,
    width: width,
    height: height,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        // Set antialias to true for smooth edges
        antialias: true, 
        // Use LINEAR_MIPMAP_NEAREST for sharper results than LINEAR_MIPMAP_LINEAR
        mipmapFilter: 'LINEAR_MIPMAP_NEAREST', 
        // Ensure pixelArt is false
        pixelArt: false,
    },
    // @ts-ignore - resolution is valid in runtime but missing in some type defs
    resolution: window.devicePixelRatio,
    
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
