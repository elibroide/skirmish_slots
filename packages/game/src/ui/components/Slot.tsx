import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { PowerCircle } from './PowerCircle';
import cardData from '../Data/order.json';
import { CardRenderer, CardInstance, CardTemplate, CardSchema } from '@skirmish/card-maker';

// Simple types if not available in ui-new yet, or import from engine
import type { UnitCard, PlayerId } from '../../engine/types';

interface SlotProps {
    unit?: UnitCard | null;
    slotModifier?: number;
    playerId: PlayerId; // 0 or 1
    terrainId: 0 | 1 | 2 | 3 | 4;
    isPlayerSlot: boolean;
}

export const Slot: React.FC<SlotProps> = ({
    unit,
    slotModifier,
    playerId,
    terrainId,
    isPlayerSlot,
}) => {
    // Lookup from Store
    const slotData = useGameStore((state) => state.players[playerId]?.slots[terrainId]);


    // Lookup Templates
    const boardTemplate = (cardData.templates as unknown as CardTemplate[]).find(t => t.name === 'BoardTile');
    const schema = cardData.schema as unknown as CardSchema;

    // Status / Power
    const status = slotData?.status || 'idle';
    const power = slotData?.power || 0;
    const powerState = slotData?.powerState || 'none';
    const modifier = slotData?.modifier ?? slotModifier ?? 0; // Prefer store, fallback to prop



    // Resolve Content
    const contentCardId = unit?.cardId || slotData?.content?.cardId;
    let cardInstance: CardInstance | undefined;

    if (contentCardId)
    {
        // 1. Prefer Runtime Instance (Dynamic)
        if (slotData?.content?.instance)
        {
            cardInstance = slotData.content.instance;
        }
        // 2. Fallback to Static Data (Legacy)
        else
        {
            const found = (cardData.cards as any[]).find((c: any) => c.id === contentCardId);
            if (found)
            {
                cardInstance = found as CardInstance;
            }
        }
    }

    // Layout & Visual Settings
    const settings = useGameStore((state) => state.boardSettings);
    const {
        cardMarginTop, cardMarginBottom, cardMarginLeft, cardMarginRight,
        slotTargetColor, slotDropColor, slotGlowRadius, slotGlowIntensity, slotPulseSpeed,
        slotModifierOffsetX, slotModifierOffsetY, slotModifierFontSize,
        slotModifierFontColor, slotModifierPositiveColor, slotModifierNegativeColor,
        slotModifierStrokeColor, slotModifierStrokeWidth
    } = settings;

    // Helper: Hex to RGB
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Auto-fit Logic (Basic)
    // We assume slot is roughly square/vertical. BoardTile should fit.
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.25);

    useEffect(() => {
        if (!containerRef.current || !boardTemplate) return;

        const updateScale = () => {
            if (!containerRef.current) return;
            const { width, height } = containerRef.current.getBoundingClientRect();

            // Apply Margins (as percentage of total slot size)
            // Margins are e.g. 0.05 (5%)
            const availWidth = width * (1 - (cardMarginLeft + cardMarginRight));
            const availHeight = height * (1 - (cardMarginTop + cardMarginBottom));

            // Template native size
            const tW = boardTemplate.width || 750;
            const tH = boardTemplate.height || 1050;

            // Fit containment based on available space
            const scaleX = availWidth / tW;
            const scaleY = availHeight / tH;

            // Use smaller scale to fit fully
            setScale(Math.min(scaleX, scaleY));
        };

        const observer = new ResizeObserver(updateScale);
        observer.observe(containerRef.current);
        updateScale(); // Initial

        return () => observer.disconnect();
    }, [boardTemplate, cardMarginTop, cardMarginBottom, cardMarginLeft, cardMarginRight]);

    // Calculate Position Offset based on Margins
    const leftPct = (cardMarginLeft + (1 - cardMarginLeft - cardMarginRight) / 2) * 100;
    const topPct = (cardMarginTop + (1 - cardMarginTop - cardMarginBottom) / 2) * 100;

    // --- Visuals ---
    const isTarget = status === 'showTarget';
    const isActive = status === 'showDrop';

    let borderColor = 'rgba(255,255,255,0.4)';
    let borderWidth = '2px';
    let bgColor = 'transparent';
    let boxShadow = 'none';
    let animation = 'none';
    let pulseStyleTag = null;

    if (isTarget || isActive)
    {
        const baseColor = isTarget ? slotTargetColor : slotDropColor;
        const rgb = hexToRgb(baseColor);

        if (rgb)
        {
            borderColor = baseColor;
            borderWidth = isTarget ? '4px' : '3px';
            bgColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`; // Low opacity bg

            // Pulse Animation
            const pulseKeyframes = `
                @keyframes slot-glow-pulse {
                    0%, 100% {
                        box-shadow: 
                            0 0 var(--glow-radius) calc(var(--glow-radius) / 3) rgba(var(--glow-rgb), var(--glow-intensity)),
                            inset 0 0 var(--glow-radius) rgba(var(--glow-rgb), calc(var(--glow-intensity) * 0.5));
                    }
                    50% {
                        box-shadow: 
                            0 0 calc(var(--glow-radius) * 1.5) calc(var(--glow-radius) / 2) rgba(var(--glow-rgb), var(--glow-intensity)),
                            inset 0 0 calc(var(--glow-radius) * 1.5) rgba(var(--glow-rgb), calc(var(--glow-intensity) * 0.5));
                    }
                }
            `;

            pulseStyleTag = <style>{pulseKeyframes}</style>;

            animation = `slot-glow-pulse ${slotPulseSpeed}s ease-in-out infinite`;
        }
    }

    // CSS Variables for Pulse
    const activeRgb = (isTarget || isActive) ? hexToRgb(isTarget ? slotTargetColor : slotDropColor) : null;
    const cssVars = activeRgb ? {
        '--glow-rgb': `${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}`,
        '--glow-radius': `${slotGlowRadius}px`,
        '--glow-intensity': slotGlowIntensity,
    } as React.CSSProperties : {};

    // Report Screen Position for Tooltips
    useEffect(() => {
        if (!containerRef.current) return;

        const reportPosition = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            useGameStore.getState().updateSlotPosition(
                playerId,
                terrainId,
                rect.x,
                rect.y,
                rect.width,
                rect.height
            );
        };

        // Report initial and on resize/scroll
        const timer = setTimeout(reportPosition, 100);
        window.addEventListener('resize', reportPosition);
        window.addEventListener('scroll', reportPosition);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', reportPosition);
            window.removeEventListener('scroll', reportPosition);
        };
    }, [playerId, terrainId, settings]); // Re-run if layout or scale changes

    return (
        <>
            {pulseStyleTag}
            <div
                ref={containerRef}
                data-player-id={playerId}
                data-terrain-id={terrainId}
                data-droppable="true"
                className="w-full h-full relative cursor-pointer group transition-colors duration-200"
                onMouseEnter={() => {
                    useGameStore.getState().setHoveredSlot({ playerId, terrainId });
                }}
                onMouseLeave={() => {
                    useGameStore.getState().setHoveredSlot(null);
                }}
                style={{
                    border: `${borderWidth} solid ${borderColor}`,
                    backgroundColor: bgColor,
                    boxShadow: boxShadow,
                    animation: animation,
                    borderRadius: '12px',
                    boxSizing: 'border-box',
                    ...cssVars
                }}
            >
                {/* Unit Render */}
                {cardInstance && boardTemplate && (
                    <div
                        className="absolute origin-center pointer-events-none"
                        style={{
                            left: `${leftPct}%`,
                            top: `${topPct}%`,
                            transform: `translate(-50%, -50%) scale(${scale})`,
                            width: boardTemplate.width || 750,
                            height: boardTemplate.height || 1050,
                            overflow: 'hidden', // Clip card content
                            borderRadius: `${12 / scale}px` // Counter-scale border radius
                        }}
                    >
                        <CardRenderer
                            template={boardTemplate}
                            data={cardInstance}
                            schema={schema}
                            scale={1} // We scale via parent div
                            className="w-full h-full"
                        />
                    </div>
                )}

                {!boardTemplate && cardInstance && <div className="text-red-500 text-xs text-center p-2">Missing BoardTile</div>}

                {/* Slot Modifier */}
                <AnimatePresence>
                    {modifier !== 0 && (
                        <motion.div
                            key="modifier-badge"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.3, type: 'spring', bounce: 0.4 }}
                            className="absolute whitespace-nowrap font-bold pointer-events-none select-none flex items-center justify-center"
                            style={{
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)', // This will be handled by motion but we need centering
                                x: '-50%', // Framer motion safe translate
                                y: '-50%',
                                zIndex: -1, // Behind the slot content
                                marginTop: `${isPlayerSlot ? slotModifierOffsetY : -slotModifierOffsetY}px`,
                                marginLeft: `${slotModifierOffsetX}px`,
                                color: modifier > 0 ? slotModifierPositiveColor : (modifier < 0 ? slotModifierNegativeColor : slotModifierFontColor),
                                fontSize: `${slotModifierFontSize}px`,
                                WebkitTextStroke: `${slotModifierStrokeWidth}px ${slotModifierStrokeColor}`,
                            }}
                        >
                            {modifier > 0 ? '+' : ''}{modifier}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Power Circle */}
                <PowerCircle
                    power={power}
                    powerState={powerState}
                    owner={isPlayerSlot ? 'player' : 'enemy'}
                />
            </div>
        </>
    );
};
