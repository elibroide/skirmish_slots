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
    // Cap resolution at 1.5 to prevent massive canvases on Retina displays
    // @ts-ignore
    resolution: Math.min(window.devicePixelRatio, 1.5),
    
    // Low Power Mode (30 FPS is plenty for a card game)
    fps: {
        target: 30,
        forceSetTimeOut: true
    },
    
    transparent: true, // Allow Seeing React Background if needed, or blending
    scene: [BoardScene],
    // Physics removed (not used)
  };
};
