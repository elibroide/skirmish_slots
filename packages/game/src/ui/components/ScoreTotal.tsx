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
        scoreTotalScale,
        scoreTotalShow
    } = settings;

    const winSettings = settings.winRecordSettings;
    const wins = useGameStore(state => state.players[playerId as 0 | 1]?.wins || 0);

    // Visibility Check
    if (!scoreTotalShow) return null;

    const bgColor = isPlayer ? powerCirclePlayerColor : powerCircleEnemyColor;
    const label = isPlayer ? "YOU" : "OPPONENT";

    // Determine Base Offset based on player side
    const baseOffsetX = isPlayer ? winSettings.playerOffsetX : winSettings.opponentOffsetX;
    const baseOffsetY = isPlayer ? winSettings.playerOffsetY : winSettings.opponentOffsetY;

    return (
        <div className="relative flex flex-col items-center">
            {/* Score Box */}
            <div
                className="flex items-center justify-center rounded-lg shadow-xl border-4 border-white text-white font-bold relative z-10"
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

            {/* Win Record Indicators (and Label) */}
            {winSettings.show && (
                <div
                    className="absolute pointer-events-none"
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) translate(${baseOffsetX}px, ${baseOffsetY}px) scale(${winSettings.scale})`,
                        width: '0px',
                        height: '0px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {/* Label */}
                    <span
                        className="absolute text-white font-black uppercase tracking-wider whitespace-nowrap"
                        style={{
                            fontSize: '14px',
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                            transform: `translate(${winSettings.textOffsetX}px, ${winSettings.textOffsetY}px)`
                        }}
                    >
                        {label}
                    </span>

                    {/* Rhombuses (2 rounds) */}
                    <div
                        className="absolute flex"
                        style={{
                            gap: `${winSettings.spacingX}px`,
                            transform: `translate(${winSettings.rhombusOffsetX}px, ${winSettings.rhombusOffsetY}px)`
                        }}
                    >
                        {[0, 1].map(i => {
                            const isWon = wins > i;
                            return (
                                <div
                                    key={i}
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        backgroundColor: isWon ? bgColor : winSettings.emptyColor,
                                        border: `${winSettings.strokeWidth}px solid ${winSettings.strokeColor}`,
                                        transform: 'rotate(45deg)',
                                        boxShadow: isWon ? `0 0 10px ${bgColor}` : 'none'
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
