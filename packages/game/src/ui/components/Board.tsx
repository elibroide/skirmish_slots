import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Slot } from './Slot';
import { ScoreTotal } from './ScoreTotal';

export const Board: React.FC = () => {
    const {
        slotHeightPercent, slotAspectRatio,
        playerSlotGapPercent, enemySlotGapPercent,
        playerRowY, enemyRowY,
        boardScale, boardX, boardY,
        scoreTotalXOffset, scoreTotalYOffset
    } = useGameStore(s => s.boardSettings);

    const localPlayerId = 0;
    const opponentId = 1;

    // We generate 5 lanes (0-4)
    const lanes = [0, 1, 2, 3, 4];

    // Helper to calculate dimensions
    // We can use inline styles with CSS vars or direct calc strings

    // Scale container
    // We'll wrap everything in a div that applies scale and translation

    // Slot Dimensions (Base, before global scale)
    const sHeight = `calc(100vh * ${slotHeightPercent})`;
    const sWidth = `calc(100vh * ${slotHeightPercent} * ${slotAspectRatio})`;

    // Gaps
    const sGapEnemy = `(100vw * ${enemySlotGapPercent})`;
    const sGapPlayer = `(100vw * ${playerSlotGapPercent})`;

    // Initialize Store Slots on Mount
    React.useEffect(() => {
        const register = useGameStore.getState().registerSlot;

        // Register 10 slots (Lanes 0-4 x 2)
        // Register 10 slots (Lanes 0-4 x 2)
        lanes.forEach(laneId => {
            const terrainId = laneId as 0 | 1 | 2 | 3 | 4;
            // Enemy (Player 1)
            register({
                playerId: 1,
                terrainId: terrainId,
                owner: 'enemy',
                x: 0, y: 0, width: 0, height: 0,
                status: 'idle',
                power: 0,
                powerState: 'none',
                content: null
            });

            // Player (Player 0)
            register({
                playerId: 0,
                terrainId: terrainId,
                owner: 'player',
                x: 0, y: 0, width: 0, height: 0,
                status: 'idle',
                power: 0,
                powerState: 'none',
                content: null
            });
        });
    }, []); // Run once


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
                    left: `calc(50vw - ${scoreTotalXOffset}px)`,
                    top: `calc(100vh * ${playerRowY} + ${scoreTotalYOffset}px)`,
                    transform: 'translate(-50%, -50%)'
                }}
            >
                <ScoreTotal playerId={localPlayerId} isPlayer={true} />
            </div>

            {/* Enemy Score */}
            <div
                className="absolute pointer-events-auto"
                style={{
                    left: `calc(50vw - ${scoreTotalXOffset}px)`,
                    top: `calc(100vh * ${enemyRowY} - ${scoreTotalYOffset}px)`,
                    transform: 'translate(-50%, -50%)'
                }}
            >
                <ScoreTotal playerId={opponentId} isPlayer={false} />
            </div>

            {lanes.map((laneId) => {
                const opponentSlotId = laneId;
                const playerSlotId = laneId + 5;

                // Layout Math: Center is index 2
                const offsetI = laneId - 2;

                // Enemy Position
                const enemyLeft = `calc(50vw + (${offsetI} * (${sWidth} + ${sGapEnemy})))`;
                const enemyTop = `calc(100vh * ${enemyRowY})`;

                // Player Position
                const playerLeft = `calc(50vw + (${offsetI} * (${sWidth} + ${sGapPlayer})))`;
                const playerTop = `calc(100vh * ${playerRowY})`;

                return (
                    <React.Fragment key={laneId}>
                        {/* Opponent Slot */}
                        <div
                            className="absolute pointer-events-auto transition-all duration-300 ease-out"
                            style={{
                                left: enemyLeft,
                                top: enemyTop,
                                width: sWidth,
                                height: sHeight,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            <Slot
                                playerId={opponentId}
                                terrainId={laneId as 0 | 1 | 2 | 3 | 4}
                                isPlayerSlot={false}
                            />
                        </div>

                        {/* Player Slot */}
                        <div
                            className="absolute pointer-events-auto transition-all duration-300 ease-out"
                            style={{
                                left: playerLeft,
                                top: playerTop,
                                width: sWidth,
                                height: sHeight,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            <Slot
                                playerId={localPlayerId}
                                terrainId={laneId as 0 | 1 | 2 | 3 | 4}
                                isPlayerSlot={true}
                            />
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
};
