import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { WinIndicators } from './WinIndicators';
import { TurnIndicators } from './TurnIndicators';

export const GameHUD: React.FC = () => {
    const {
        boardScale, boardX, boardY,
        winRecordSettings
    } = useGameStore(s => s.boardSettings);

    const localPlayerId = 0;
    const opponentId = 1;

    return (
        <div
            className="absolute inset-0 pointer-events-none font-bold"
            style={{
                transform: `translate(${boardX}px, ${boardY}px) scale(${boardScale})`,
                transformOrigin: 'center center'
            }}
        >
            {/* Score Totals (Left Side) */}
            {/* Player Score */}
            <div
                className="absolute pointer-events-auto"
                style={{
                    left: `${winRecordSettings.playerXPercent}%`,
                    top: `${winRecordSettings.playerYPercent}%`,
                    transform: 'translate(-50%, -50%)'
                }}
            >
                <WinIndicators playerId={localPlayerId} isPlayer={true} />
            </div>

            {/* Enemy Score */}
            <div
                className="absolute pointer-events-auto"
                style={{
                    left: `${winRecordSettings.opponentXPercent}%`,
                    top: `${winRecordSettings.opponentYPercent}%`,
                    transform: 'translate(-50%, -50%)'
                }}
            >
                <WinIndicators playerId={opponentId} isPlayer={false} />
            </div>

            {/* Turn Indicators - Opponent */}
            <TurnIndicators playerId={opponentId} isPlayer={false} />


            {/* Turn Indicators - Player */}
            <TurnIndicators playerId={localPlayerId} isPlayer={true} />
        </div>
    );
};
