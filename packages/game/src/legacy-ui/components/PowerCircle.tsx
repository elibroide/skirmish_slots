import React from 'react';
import { useGameStore } from '../../store/gameStore';

interface PowerCircleProps {
    power: number;
    powerState: 'none' | 'contested' | 'winning';
    owner: 'player' | 'enemy';
}

export const PowerCircle: React.FC<PowerCircleProps> = ({ power, powerState, owner }) => {
    const settings = useGameStore((state) => state.boardSettings);

    // If none (and we respect that logic), usually we hide. 
    // But strictly per user previous request, we might show "none" state?
    // User said "lets display them when status none as well" in Step 153.
    // Using a neutral visual for 'none'.

    const isWins = powerState === 'winning';
    const isPlayer = owner === 'player';

    // Colors
    const fillColor = isPlayer ? '#3b82f6' : '#f97316'; // Blue-500 : Orange-500
    const strokeColor = isWins ? '#ffd700' : '#000000'; // Gold : Black

    // Dimensions from settings
    const {
        powerCircleRadius,
        powerCircleFontSize,
        powerCircleStrokeWidth,
        powerCircleOffsetX,
        powerCircleOffsetY
    } = settings;

    // Position Logic
    // The Circle is absolute relative to the Slot.
    // We need to verify Slot's coordinate system. Usually Slot is the "box".
    // Player Slot: Circle at TOP.
    // Enemy Slot: Circle at BOTTOM.

    // We'll use style `top` or `bottom`.
    // Note: settings.powerCircleOffsetY is typically negative (-20) to move UP.
    // If we anchor to TOP for PLAYER: top: offsetY.
    // If we anchor to BOTTOM for ENEMY: bottom: offsetY.

    // Wait, if Y is negative (-20):
    // Player (Top): top: -20px (moves up, out of box).
    // Enemy (Bottom): bottom: -20px (moves down, out of box).
    // This mirrors correctly.

    const positionStyle: React.CSSProperties = {
        position: 'absolute',
        left: `calc(50% + ${powerCircleOffsetX}px)`, // Centered X + Offset
        transform: 'translate(-50%, -50%)', // Center the circle itself
        zIndex: 20,
    };

    if (isPlayer)
    {
        positionStyle.top = `${powerCircleOffsetY}px`;
    } else
    {
        positionStyle.bottom = `${powerCircleOffsetY}px`;
    }

    return (
        <div style={positionStyle} className="flex items-center justify-center pointer-events-none">
            {/* Glow Effect for Winning */}
            {isWins && (
                <div
                    className="absolute rounded-full animate-pulse"
                    style={{
                        width: `${powerCircleRadius * 2 * 1.6}px`,
                        height: `${powerCircleRadius * 2 * 1.6}px`,
                        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, rgba(255, 215, 0, 0) 70%)',
                    }}
                />
            )}

            {/* Main Circle */}
            <div
                style={{
                    width: `${powerCircleRadius * 2}px`,
                    height: `${powerCircleRadius * 2}px`,
                    backgroundColor: fillColor,
                    border: `${powerState === 'none' ? 2 : powerCircleStrokeWidth}px solid ${strokeColor}`,
                    borderColor: powerState === 'none' ? 'rgba(0,0,0,0.5)' : strokeColor,
                    opacity: powerState === 'none' ? 0.0 : 1.0, // Actually, maybe hide fully if none? 
                    // Re-reading: "lets display them when status none as well" -> implies opacity 1?
                    // But usually 'none' means "no power".
                    // Let's stick to visible but neutral if desired, OR just follow the 'none' state.
                    // Wait, 'none' usually means HIDDEN in game logic.
                    // Step 153 User: "lets display them when status none as well".
                    // Ok, so visible.
                }}
                className={`rounded-full flex items-center justify-center shadow-md ${powerState === 'none' ? 'opacity-50' : 'opacity-100'}`}
            >
                <span
                    style={{
                        fontSize: `${powerCircleFontSize}px`,
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 'bold',
                        color: 'white',
                        textShadow: '0px 1px 2px rgba(0,0,0,0.5)'
                    }}
                >
                    {power}
                </span>
            </div>
        </div>
    );
};
