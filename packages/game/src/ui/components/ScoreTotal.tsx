import React from 'react';
import { useGameStore } from '../../store/gameStore';

interface ScoreTotalProps {
    playerId: number;
    isPlayer: boolean;
}

export const ScoreTotal: React.FC<ScoreTotalProps> = ({ playerId, isPlayer }) => {
    // Select total power from store
    const totalPower = useGameStore(state => {
        const slots = state.players[playerId as 0 | 1]?.slots;
        if (!slots) return 0;
        return Object.values(slots).reduce((sum, slot) => sum + (slot.power || 0), 0);
    });

    const settings = useGameStore((state) => state.boardSettings);
    const {
        powerCirclePlayerColor,
        powerCircleEnemyColor,
        scoreTotalScale
    } = settings;

    const bgColor = isPlayer ? powerCirclePlayerColor : powerCircleEnemyColor;

    return (
        <div
            className="flex items-center justify-center rounded-lg shadow-xl border-4 border-white text-white font-bold"
            style={{
                backgroundColor: bgColor,
                width: '80px',
                height: '60px',
                fontSize: '32px',
                transform: `scale(${scoreTotalScale})`,
                transformOrigin: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
        >
            {totalPower}
        </div>
    );
};
