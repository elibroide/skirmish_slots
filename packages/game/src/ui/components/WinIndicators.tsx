import React from 'react';
import { useGameStore } from '../../store/gameStore';

interface WinIndicatorsProps {
    playerId: number;
    isPlayer: boolean;
}

export const WinIndicators: React.FC<WinIndicatorsProps> = ({ playerId, isPlayer }) => {
    const settings = useGameStore((state) => state.boardSettings);
    const {
        powerCirclePlayerColor,
        powerCircleEnemyColor,
    } = settings;

    const winSettings = settings.winRecordSettings;
    const wins = useGameStore(state => state.players[playerId as 0 | 1]?.wins || 0);

    // Visibility Check
    if (!winSettings.show) return null;

    const bgColor = isPlayer ? powerCirclePlayerColor : powerCircleEnemyColor;
    const label = isPlayer ? "YOU" : "OPPONENT";

    // Determine Base Offset based on player side
    const baseOffsetX = isPlayer ? winSettings.playerOffsetX : winSettings.opponentOffsetX;
    const baseOffsetY = isPlayer ? winSettings.playerOffsetY : winSettings.opponentOffsetY;

    const textColor = isPlayer ? winSettings.playerTextColor : winSettings.opponentTextColor;

    // Specific Offsets
    const textOffsetX = isPlayer ? winSettings.playerTextOffsetX : winSettings.opponentTextOffsetX;
    const textOffsetY = isPlayer ? winSettings.playerTextOffsetY : winSettings.opponentTextOffsetY;
    const rhombusOffsetX = isPlayer ? winSettings.playerRhombusOffsetX : winSettings.opponentRhombusOffsetX;
    const rhombusOffsetY = isPlayer ? winSettings.playerRhombusOffsetY : winSettings.opponentRhombusOffsetY;

    return (
        <div className="relative flex flex-col items-center">
            {/* Win Record Indicators (and Label) */}
            <div
                className="absolute pointer-events-none"
                style={{
                    // Since we removed the score box, we might need to adjust the positioning context
                    // Previously it was centered via flex in the parent div.
                    // Now, let's keep the same "center of this component" as the origin point.
                    top: '0px',
                    left: '0px',
                    transform: `translate(${baseOffsetX}px, ${baseOffsetY}px) scale(${winSettings.scale})`,
                    width: '0px',
                    height: '0px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* Label */}
                <span
                    className="absolute font-black uppercase tracking-wider whitespace-nowrap"
                    style={{
                        color: textColor,
                        fontSize: `${winSettings.fontSize}px`,
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        transform: `translate(${textOffsetX}px, ${textOffsetY}px)`
                    }}
                >
                    {label}
                </span>

                {/* Rhombuses (2 rounds) */}
                <div
                    className="absolute flex"
                    style={{
                        gap: `${winSettings.spacingX}px`,
                        transform: `translate(${rhombusOffsetX}px, ${rhombusOffsetY}px) scale(${winSettings.rhombusScale})`
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
        </div>
    );
};

