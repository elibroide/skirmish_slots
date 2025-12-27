import React from 'react';
import { useGameStore, TurnStatus } from '../../store/gameStore';

interface TurnIndicatorsProps {
    playerId: number;
    isPlayer: boolean;
}

import { motion, AnimatePresence } from 'framer-motion';

export const TurnIndicators: React.FC<TurnIndicatorsProps> = ({ playerId, isPlayer }) => {
    const settings = useGameStore((state) => state.boardSettings);
    const turnSettings = settings.turnIndicatorSettings;
    const turnStatus = useGameStore(state => state.players[playerId as 0 | 1]?.turnStatus || 'none');

    // Positioning
    const xPercent = isPlayer ? turnSettings.playerXPercent : turnSettings.opponentXPercent;
    const yPercent = isPlayer ? turnSettings.playerYPercent : turnSettings.opponentYPercent;
    const offsetX = isPlayer ? turnSettings.playerOffsetX : turnSettings.opponentOffsetX;
    const offsetY = isPlayer ? turnSettings.playerOffsetY : turnSettings.opponentOffsetY;

    // Colors
    const color = isPlayer ? turnSettings.playerTextColor : turnSettings.opponentTextColor;

    // Content Logic
    let text = '';
    if (turnStatus === 'turn')
    {
        text = isPlayer ? "YOUR TURN" : "OPPONENT'S TURN";
    } else if (turnStatus === 'done')
    {
        text = "DONE";
    } else if (turnStatus === 'last_say')
    {
        text = "LAST SAY";
    }

    const isVisible = turnSettings.show && turnStatus !== 'none';

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="absolute pointer-events-none flex items-center justify-center"
                    style={{
                        left: `${xPercent}%`,
                        top: `${yPercent}%`,
                        zIndex: 40
                    }}
                    initial={{
                        opacity: 0,
                        scale: 0.5,
                        x: `calc(-50% + ${offsetX}px)`,
                        y: `calc(-50% + ${offsetY}px)`
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        x: `calc(-50% + ${offsetX}px)`,
                        y: `calc(-50% + ${offsetY}px)`
                    }}
                    exit={{
                        opacity: 0,
                        scale: 0.5,
                        x: `calc(-50% + ${offsetX}px)`,
                        y: `calc(-50% + ${offsetY}px)`
                    }}
                    transition={{
                        duration: 0.3,
                        ease: [0.34, 1.56, 0.64, 1] // Spring-like tween
                    }}
                >
                    <span
                        className="font-black uppercase tracking-wider whitespace-nowrap"
                        style={{
                            color: color,
                            fontSize: `${turnSettings.fontSize}px`,
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                        }}
                    >
                        {text}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
