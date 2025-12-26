import React, { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface PowerCircleProps {
    power: number;
    powerState: 'none' | 'contested' | 'winning';
    owner: 'player' | 'enemy';
}

const PowerCircleComponent: React.FC<PowerCircleProps> = ({ power, powerState, owner }) => {
    const settings = useGameStore((state) => state.boardSettings);

    const isWins = powerState === 'winning';
    const isPlayer = owner === 'player';

    // Position Logic
    const {
        powerCircleRadius,
        powerCircleFontSize,
        powerCircleStrokeWidth,
        powerCircleOffsetX,
        powerCircleOffsetY,
        powerCircleFlipPositions,
        powerCirclePlayerColor,
        powerCircleEnemyColor,
        powerCircleStrokeColor,
        powerCircleWinningStrokeColor,
        powerCircleWinningGlowColor,
        powerCircleScaleContested,
        powerCircleScaleWinning,
        powerCircleWinGlowScaleMin,
        powerCircleWinGlowScaleMax,
        powerCircleWinGlowSpeed,
        powerCircleTextStrokeWidth,
        powerCircleTextStrokeColor
    } = settings;

    // Helper: Hex to RGB for Glow (reused or duplicated)
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 215, 0';
    }

    const glowRgb = hexToRgb(powerCircleWinningGlowColor);

    // Colors
    const fillColor = isPlayer ? powerCirclePlayerColor : powerCircleEnemyColor;
    const strokeColor = isWins ? powerCircleWinningStrokeColor : powerCircleStrokeColor;

    // Determine Anchor Side
    // Default: Player = Top, Enemy = Bottom
    // Flip: Player = Bottom, Enemy = Top
    let anchorTop = isPlayer;
    if (powerCircleFlipPositions)
    {
        anchorTop = !anchorTop;
    }

    // Invert Offset Y for Opponent as requested
    const finalOffsetY = isPlayer ? powerCircleOffsetY : -powerCircleOffsetY;

    const positionStyle: React.CSSProperties = {
        position: 'absolute',
        left: `calc(50% + ${powerCircleOffsetX}px)`, // Centered X + Offset
        zIndex: 20,
    };

    if (anchorTop)
    {
        positionStyle.top = '0px';
        positionStyle.transform = `translate(-50%, calc(-50% + ${finalOffsetY}px))`;
    } else
    {
        positionStyle.bottom = '0px';
        positionStyle.transform = `translate(-50%, calc(50% + ${finalOffsetY}px))`;
    }

    // Animation Variants
    const variants: Variants = useMemo(() => ({
        none: {
            scale: 0,
            opacity: 0,
            transition: { duration: 0.2 }
        },
        contested: {
            scale: powerCircleScaleContested,
            opacity: 1,
            transition: { type: 'spring', stiffness: 400, damping: 25 }
        },
        winning: {
            scale: powerCircleScaleWinning,
            opacity: 1,
            transition: { type: 'spring', stiffness: 400, damping: 25 }
        }
    }), [powerCircleScaleContested, powerCircleScaleWinning]);

    return (
        <div style={positionStyle} className="flex items-center justify-center pointer-events-none">
            <AnimatePresence mode='wait'>
                {powerState !== 'none' && (
                    <motion.div
                        key="circle-container"
                        initial="none"
                        animate={powerState}
                        exit="none"
                        variants={variants}
                        className="relative flex items-center justify-center"
                    >
                        {/* Glow Effect for Winning - BEHIND main circle */}
                        {isWins && (
                            <motion.div
                                className="absolute rounded-full"
                                initial={{ opacity: 0.5, scale: powerCircleWinGlowScaleMin }}
                                animate={{
                                    opacity: [0.4, 0.8, 0.4],
                                    scale: [powerCircleWinGlowScaleMin, powerCircleWinGlowScaleMax, powerCircleWinGlowScaleMin]
                                }}
                                transition={{
                                    duration: powerCircleWinGlowSpeed,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                style={{
                                    width: `${powerCircleRadius * 2}px`,
                                    height: `${powerCircleRadius * 2}px`,
                                    background: `radial-gradient(circle, rgba(${glowRgb}, 0.6) 0%, rgba(${glowRgb}, 0) 70%)`,
                                    zIndex: -1, // Ensure strictly behind
                                }}
                            />
                        )}

                        {/* Main Circle - ZIndex 0 */}
                        <motion.div
                            style={{
                                width: `${powerCircleRadius * 2}px`,
                                height: `${powerCircleRadius * 2}px`,
                                backgroundColor: fillColor,
                                border: `${powerCircleStrokeWidth}px solid ${strokeColor}`,
                                borderColor: strokeColor,
                                zIndex: 0,
                            }}
                            className={`rounded-full flex items-center justify-center shadow-md relative`}
                        >
                            {/* Text - ZIndex 10 (Strictly Above) */}
                            <span
                                style={{
                                    fontSize: `${powerCircleFontSize}px`,
                                    fontFamily: 'Arial, sans-serif',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    WebkitTextStroke: `${powerCircleTextStrokeWidth}px ${powerCircleTextStrokeColor}`,
                                    zIndex: 10,
                                    position: 'relative',
                                }}
                            >
                                {power}
                            </span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const PowerCircle = React.memo(PowerCircleComponent);
