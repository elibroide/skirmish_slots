import React, { useRef } from 'react';
import { CardRenderer } from '@skirmish/card-maker';
import type { CardInstance, CardTemplate, CardSchema } from '@skirmish/card-maker';
import { useGameStore } from '../../store/gameStore';
import { CardBack } from './CardBack';
import { CardTooltip } from './CardTooltip';

export const BASE_CARD_WIDTH = 750;
export const BASE_CARD_HEIGHT = 1050;

export interface HandSettings {
    fanSpacing: number;
    fanRotation: number;
    fanArcHeight: number;
    // Manual Squeeze Controls
    maxCardsSqueeze: number;
    squeezeSpacing: number;
    squeezeRotation: number;
    squeezeArcHeight: number;
    hoverLift: number;
    hoverScale: number;
    hoverTransitionDuration: number;
    dragThresholdY: number;
    dragScale: number;
    tiltMaxAngle: number;
    tiltSensitivity: number;
    tiltSmoothing: number;
    tiltReturnSpeed: number;
    velocityDecay: number;
    tiltVelocityThreshold: number; // New Setting
    returnDuration: number;
    returnSpringiness: number;

    // Slam Animation (Anticipation -> Impact)
    slamDuration: number;    // Total time for the slam sequence
    slamScalePeak: number;   // Max scale during anticipation
    slamScaleLand: number;   // Final scale (or scale just before impact)
    slamHeight: number;      // How high it lifts during anticipation

    // Size & Scale
    cardScale: number; // Controls the base size relative to 750x1050

    hitAreaWidth: number;
    hitAreaHeight: number;
    showHitAreas: boolean;
    perspective: number;

    // Glow Settings
    glowColorPlayable: string;
    glowColorDragging: string;
    glowColorTargeting: string;

    // Back-Glow Geometry
    glowExpLeft: number;
    glowExpRight: number;
    glowExpTop: number;
    glowExpBottom: number;
    glowCornerRadius: number; // 0 = sharp
    glowOffsetX: number; // Global shift
    glowOffsetY: number; // Global shift
    glowOpacity: number; // Edge/Pulse opacity
    fillOpacity: number; // Solid rect opacity
    glowPulseSpeed: number; // 0 = no pulse
    glowBlur: number; // Edge softness

    // Debug
    debugForcePlayable: boolean;

    // Positioning
    baseX: number; // % from left
    baseY: number; // px from bottom

    // Facedown (Opponent) Positioning
    facedownBaseX: number; // % from left
    facedownBaseY: number; // px from Top (usually)
}

export const DEFAULT_SETTINGS: HandSettings = {
    // Fan layout
    fanSpacing: 105,
    fanRotation: 3.5,
    fanArcHeight: 3,

    // Manual Squeeze Controls
    maxCardsSqueeze: 8,
    squeezeSpacing: 10,
    squeezeRotation: 0.1,
    squeezeArcHeight: 0.3,

    // Hover effects
    hoverLift: 125,
    hoverScale: 1.3,
    hoverTransitionDuration: 0.15,

    // Drag settings
    dragThresholdY: 50,
    dragScale: 1.0,

    // Drag tilt physics
    tiltMaxAngle: 20,
    tiltSensitivity: 1.5,
    tiltSmoothing: 0.5,
    tiltReturnSpeed: 0.15,
    velocityDecay: 0.85,
    tiltVelocityThreshold: 2,

    // Return animation
    returnDuration: 0.15,
    returnSpringiness: 1.56,

    // Slam Animation
    slamDuration: 0.6,
    slamScalePeak: 1.5,
    slamScaleLand: 0.8,
    slamHeight: -100,

    // Size & Scale
    cardScale: 0.25,

    hitAreaWidth: 140,
    hitAreaHeight: 255,
    showHitAreas: false,

    // Visual
    perspective: 2000,

    // Glow Defaults
    glowColorPlayable: '#21b9c4',
    glowColorDragging: '#eab308',
    glowColorTargeting: '#ace708',

    // Back-Glow Defaults
    glowExpLeft: 4,
    glowExpRight: -9,
    glowExpTop: 2.5,
    glowExpBottom: 2.5,
    glowCornerRadius: 5,
    glowOffsetX: 0,
    glowOffsetY: 0,
    glowOpacity: 0.5,
    fillOpacity: 1,
    glowPulseSpeed: 1,
    glowBlur: 10,

    debugForcePlayable: true,

    // Positioning
    baseX: 50,
    baseY: -150,

    // Facedown Defaults
    facedownBaseX: 0,
    facedownBaseY: -225, // Positive value from top
};

// Card component types
export interface CardProps {
    card: CardInstance;
    index: number;
    totalCards: number;
    isHovered: boolean;
    hoveredIndex: number | null;
    onHover: (index: number) => void;
    onLeave: () => void;
    onDragStart: (e: React.MouseEvent, card: CardInstance, index: number) => void;
    isDragging: boolean;
    isReturning: boolean;
    settings: HandSettings;
    templates: CardTemplate[];
    schema: CardSchema;
    glowState: CardGlowState;
    isFacedown?: boolean; // Renamed from isOpponent
}

export type CardGlowState = 'none' | 'playable' | 'dragging' | 'targeting';

export const Card: React.FC<CardProps> = ({
    card,
    index,
    totalCards,
    isHovered,
    hoveredIndex,
    onHover,
    onLeave,
    onDragStart,
    isDragging,
    isReturning,
    settings,
    templates,
    schema,
    glowState = 'none',
    isFacedown = false
}) => {
    // Refs for animation
    const cardRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Get Hand Tooltip Settings from global store (reactive)
    const storeSettings = useGameStore(state => state.boardSettings);
    const handTooltipSettings = storeSettings.handTooltipSettings || { show: false };

    const centerIndex = (totalCards - 1) / 2;
    const offsetFromCenter = index - centerIndex;

    // Base fan calculations using Manual Squeeze Settings

    // 1. Calculate how many cards are "extra" beyond the squeeze threshold
    // Use fallback values to prevent NaN if settings are missing
    const maxCards = settings.maxCardsSqueeze || 100;
    const extraCards = Math.max(0, totalCards - maxCards);

    // 2. Apply linear decay per extra card
    // Ensuring we don't go below minimums
    const effectiveSpacing = Math.max(10, settings.fanSpacing - (extraCards * (settings.squeezeSpacing || 0)));

    // Opponent Inversion: Frown instead of Smile, and Reverse Rotation
    const rotationMult = isFacedown ? -1 : 1;
    const arcMult = isFacedown ? -1 : 1;

    // Note: We only invert the calculated values. The parameters themselves (from settings) are positive.
    const effectiveRotation = Math.max(0, settings.fanRotation - (extraCards * (settings.squeezeRotation || 0))) * rotationMult;
    const effectiveArcHeight = Math.max(0, settings.fanArcHeight - (extraCards * (settings.squeezeArcHeight || 0))) * arcMult;

    // 3. Position Calculation
    const baseTranslateX = offsetFromCenter * effectiveSpacing;

    // 4. Parabolic Arc Calculation using effective height
    const baseTranslateY = Math.pow(offsetFromCenter, 2) * effectiveArcHeight;

    // 5. Rotation
    const baseRotation = offsetFromCenter * effectiveRotation;

    // Hover state calculations
    let rotation = baseRotation;
    // let translateX = baseTranslateX; // Unused
    let translateY = baseTranslateY;
    let translateZ = 0;

    // Visual Scale (for Hover effects)
    // The base size is determined by settings.cardScale, so we start at scale 1.0 (relative to that size)
    // and multiply by hoverScale.
    let visualScale = 1.0;
    let zIndex = (totalCards - index) + 10;

    if (hoveredIndex !== null && !isDragging && !isFacedown)
    {
        if (isHovered)
        {
            rotation = 0;
            translateY = -settings.hoverLift;
            translateZ = 100;
            visualScale = settings.hoverScale;
            zIndex = 100;
        }
    }

    // If this card is being dragged or returning, hide it from the fan
    if (isDragging || isReturning)
    {
        return null;
    }

    // Find template
    const template = templates.find(t => t.id === card.templateId);

    // Dynamic Dimensions
    const cardWidth = BASE_CARD_WIDTH * settings.cardScale;
    const cardHeight = BASE_CARD_HEIGHT * settings.cardScale;

    // Determine Glow Color based on Explicit State
    let activeGlowColor: string | null = null;
    switch (glowState)
    {
        case 'targeting':
            activeGlowColor = settings.glowColorTargeting;
            break;
        case 'dragging':
            activeGlowColor = settings.glowColorDragging;
            break;
        case 'playable':
            activeGlowColor = settings.glowColorPlayable;
            break;
        case 'none':
        default:
            activeGlowColor = null;
            break;
    }

    // Shadow logic (standard lift, independent of glow now)
    const shadowFilter = isHovered && !isFacedown
        ? 'drop-shadow(0 25px 40px rgba(0,0,0,0.5))'
        : 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))';

    return (
        <div
            style={{
                position: 'absolute',
                left: '50%',
                bottom: '20px',
                width: `${settings.hitAreaWidth}px`,
                height: `${settings.hitAreaHeight}px`,
                marginLeft: `${-settings.hitAreaWidth / 2}px`,
                transform: `translateX(${baseTranslateX}px)`,
                transformOrigin: isFacedown ? 'center top' : 'center bottom',
                zIndex: zIndex + 50,
                cursor: isFacedown ? 'default' : 'grab',
            }}
            onMouseEnter={!isFacedown ? () => onHover(index) : undefined}
            onMouseLeave={!isFacedown ? onLeave : undefined}
            onMouseDown={!isFacedown ? (e) => onDragStart(e, card, index) : undefined}
        >
            {/* Render Card Back if Foe */}
            {isFacedown ? (
                <div style={{
                    position: 'absolute',
                    // Center it
                    left: '50%',
                    // If hanging, align top
                    top: '0',
                    marginLeft: `${-cardWidth / 2}px`,
                    width: `${cardWidth}px`,
                    height: `${cardHeight}px`,
                    transform: `
                        translateY(${translateY}px) 
                        translateZ(${translateZ}px)
                        rotate(${rotation}deg) 
                        scale(${visualScale})
                      `,
                    transformOrigin: 'center top', // Match parent
                    filter: shadowFilter,
                    transition: `all ${settings.hoverTransitionDuration}s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                }}>
                    <CardBack width={cardWidth} height={cardHeight} />
                </div>
            ) : (
                // Existing Card Face Logic
                <>
                    {/* NEW Split Back-Glow with Expansion */}
                    {activeGlowColor && (
                        <>
                            {/* 1. Pulsing Edge Glow (Deepest) */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    bottom: '0',
                                    // Calculate total width/height based on base card + expansions
                                    width: `${cardWidth + settings.glowExpLeft + settings.glowExpRight}px`,
                                    height: `${cardHeight + settings.glowExpTop + settings.glowExpBottom}px`,
                                    // Center horizontally based on expansions relative to center
                                    // X margin: we want the LEFT edge to be at -cardWidth/2 - expLeft
                                    marginLeft: `${-(cardWidth / 2) - settings.glowExpLeft}px`,
                                    marginBottom: `${-settings.glowExpBottom + settings.glowOffsetY}px`,
                                    // Note: anchor is bottom, so we extend down by ExpBottom. 
                                    // ExpTop is handled by height increase upwards.

                                    backgroundColor: activeGlowColor,
                                    borderRadius: `${settings.glowCornerRadius}px`,
                                    opacity: settings.glowOpacity,
                                    filter: `blur(${settings.glowBlur}px)`,
                                    transform: `
                                    translateX(${settings.glowOffsetX}px)
                                    translateY(${translateY}px) 
                                    translateZ(${translateZ - 0.2}px) 
                                    rotate(${rotation}deg) 
                                    scale(${visualScale})
                                `,
                                    transformOrigin: 'center bottom',
                                    transition: `all ${settings.hoverTransitionDuration}s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                                    pointerEvents: 'none',
                                }}
                                className={settings.glowPulseSpeed > 0 ? "animate-pulse-glow" : ""}
                            />

                            {/* 2. Solid Backing Rect (Middle) */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    bottom: '0',
                                    width: `${cardWidth + settings.glowExpLeft + settings.glowExpRight}px`,
                                    height: `${cardHeight + settings.glowExpTop + settings.glowExpBottom}px`,
                                    marginLeft: `${-(cardWidth / 2) - settings.glowExpLeft}px`,
                                    marginBottom: `${-settings.glowExpBottom + settings.glowOffsetY}px`,

                                    backgroundColor: activeGlowColor,
                                    borderRadius: `${settings.glowCornerRadius}px`,
                                    opacity: settings.fillOpacity,
                                    filter: 'none',
                                    transform: `
                                    translateX(${settings.glowOffsetX}px)
                                    translateY(${translateY}px) 
                                    translateZ(${translateZ - 0.1}px) 
                                    rotate(${rotation}deg) 
                                    scale(${visualScale})
                                `,
                                    transformOrigin: 'center bottom',
                                    transition: `all ${settings.hoverTransitionDuration}s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                                    pointerEvents: 'none',
                                }}
                            />
                        </>
                    )}
                    {/* Visual card - positioned behind hit areas */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '50%',
                            marginLeft: `${-cardWidth / 2}px`,
                            width: `${cardWidth}px`,
                            height: `${cardHeight}px`,
                            transform: `
                translateY(${translateY}px) 
                translateZ(${translateZ}px)
                rotate(${rotation}deg) 
                scale(${visualScale})
            `,
                            transformOrigin: 'center bottom',
                            transition: `all ${settings.hoverTransitionDuration}s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                            filter: shadowFilter,
                            pointerEvents: 'none',
                            zIndex: isHovered ? 100 : zIndex,
                            // Center the oversized CardRenderer content
                            // display: 'flex', // REMOVED to prevent squashing
                            // alignItems: 'flex-end',
                            // justifyContent: 'center',
                            overflow: 'visible', // Allow renderer to just be there (it's scaled down anyway)
                        }}
                    >
                        {template ? (
                            <CardRenderer
                                template={template}
                                data={card}
                                schema={schema}
                                scale={settings.cardScale}
                                className="pointer-events-none origin-top-left"
                            />
                        ) : (
                            <div className="bg-red-500 text-white p-2">No Template</div>
                        )}

                        {/* Tooltip Injection */}
                        {isHovered && !isFacedown && (
                            <CardTooltip
                                card={card}
                                settings={handTooltipSettings}
                            />
                        )}
                    </div>
                </>
            )}


            {settings.showHitAreas && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(255, 0, 0, 0.4)',
                    border: '1px dashed red',
                    zIndex: 9999,
                    pointerEvents: 'none',
                    borderRadius: '4px',
                }} />
            )}
        </div>
    );
};
