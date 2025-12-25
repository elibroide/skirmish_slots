import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './game';

export const PhaserLayer: React.FC = () => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!gameContainerRef.current) return;

        // Init Game
        const config = createGameConfig(
            gameContainerRef.current,
            window.innerWidth,
            window.innerHeight,
        );

        gameRef.current = new Phaser.Game(config);

        // Cleanup
        return () => {
            if (gameRef.current)
            {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={gameContainerRef}
            className="absolute inset-0 pointer-events-none" // Allow clicks to pass through to start with
            style={{ zIndex: 0 }}
        />
    );
};
