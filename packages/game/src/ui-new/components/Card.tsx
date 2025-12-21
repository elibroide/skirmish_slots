import React from 'react';
import { CardRenderer } from '@skirmish/card-maker';
import type { CardInstance, CardTemplate, CardSchema } from '@skirmish/card-maker';

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

    // Positioning
    baseX: number; // % from left
    baseY: number; // px from bottom
}

interface CardProps {
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
}

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
    schema
}) => {
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
    const effectiveRotation = Math.max(0, settings.fanRotation - (extraCards * (settings.squeezeRotation || 0)));
    const effectiveArcHeight = Math.max(0, settings.fanArcHeight - (extraCards * (settings.squeezeArcHeight || 0)));

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

    if (hoveredIndex !== null && !isDragging)
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
                transformOrigin: 'center bottom',
                zIndex: zIndex + 50,
                cursor: 'grab',
            }}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={onLeave}
            onMouseDown={(e) => onDragStart(e, card, index)}
        >
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
                    filter: isHovered ? 'drop-shadow(0 25px 40px rgba(0,0,0,0.5))' : 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
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
            </div>


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
