import React from 'react';
import { HandSettings, BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from './Card';
import { CardRenderer, CardInstance, CardTemplate, CardSchema } from '@skirmish/card-maker';
import { CardTooltip } from './CardTooltip';

import { useGameStore } from '../../store/gameStore';

interface DraggedCardProps {
    card: CardInstance;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    settings: HandSettings;
    templates: CardTemplate[];
    schema: CardSchema;
    glowState: 'dragging' | 'targeting' | 'valid-target' | 'invalid-target'; // DraggedCard is always one of these
}

export const DraggedCard: React.FC<DraggedCardProps> = ({
    card,
    position,
    velocity,
    settings,
    templates,
    schema,
    glowState = 'dragging'
}) => {
    // Calculate tilt based on velocity
    const maxTilt = settings.tiltMaxAngle;
    const tiltSensitivity = settings.tiltSensitivity;

    // Check velocity threshold
    const velocityMag = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const isMovingFastEnough = velocityMag > (settings.tiltVelocityThreshold || 0);

    let tiltX = 0;
    let tiltY = 0;

    if (isMovingFastEnough)
    {
        tiltX = Math.max(-maxTilt, Math.min(maxTilt, -velocity.y * tiltSensitivity));
        tiltY = Math.max(-maxTilt, Math.min(maxTilt, velocity.x * tiltSensitivity));
    }

    const template = templates.find(t => t.id === card.templateId);

    // Dynamic Dimensions
    const cardWidth = BASE_CARD_WIDTH * settings.cardScale;
    const cardHeight = BASE_CARD_HEIGHT * settings.cardScale;

    // Determine Glow Color
    let activeGlowColor = settings.glowColorDragging;
    if (glowState === 'targeting') activeGlowColor = settings.glowColorTargeting;
    else if (glowState === 'valid-target') activeGlowColor = '#FFFF00'; // Yellow
    else if (glowState === 'invalid-target') activeGlowColor = '#FF0000'; // Red

    const activeScale = glowState === 'valid-target' ? settings.dragScale + 0.1 : settings.dragScale;

    // Standard Shadow
    const shadowFilter = 'drop-shadow(0 30px 50px rgba(0,0,0,0.6))';

    return (
        <div
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 1000,
                pointerEvents: 'none',
                perspective: `${settings.perspective}px`,
            }}
        >
            {/* Split Back-Glow */}
            {/* 1. Pulsing Edge Glow */}
            <div style={{
                position: 'absolute',
                // Width = Base + Expansions
                width: `${cardWidth + settings.glowExpLeft + settings.glowExpRight}px`,
                height: `${cardHeight + settings.glowExpTop + settings.glowExpBottom}px`,
                // Center relative to the dragged position (which is center of card)
                // Left offset = -HalfCard - LeftExp
                marginLeft: `${-(cardWidth / 2) - settings.glowExpLeft}px`,
                // Top offset = -HalfHeight - TopExp
                marginTop: `${-(cardHeight / 2) - settings.glowExpTop}px`,

                // Offsets
                transform: `
                    translateY(${settings.glowOffsetY}px)
                    translateX(${settings.glowOffsetX}px)
                    scale(${activeScale}) 
                    rotateX(${tiltX}deg) 
                    rotateY(${tiltY}deg)
                `,
                backgroundColor: activeGlowColor,
                borderRadius: `${settings.glowCornerRadius}px`,
                opacity: settings.glowOpacity,
                filter: `blur(${settings.glowBlur}px)`,
                transformOrigin: 'center center', // Scale from center
                transition: `transform ${settings.tiltReturnSpeed}s ease-out`,
                zIndex: -2
            }}
                className={settings.glowPulseSpeed > 0 ? "animate-pulse-glow" : ""}
            />

            {/* 2. Solid Backing Rect */}
            <div style={{
                position: 'absolute',
                width: `${cardWidth + settings.glowExpLeft + settings.glowExpRight}px`,
                height: `${cardHeight + settings.glowExpTop + settings.glowExpBottom}px`,
                marginLeft: `${-(cardWidth / 2) - settings.glowExpLeft}px`,
                marginTop: `${-(cardHeight / 2) - settings.glowExpTop}px`,
                transform: `
                    translateY(${settings.glowOffsetY}px)
                    translateX(${settings.glowOffsetX}px)
                    scale(${activeScale}) 
                    rotateX(${tiltX}deg) 
                    rotateY(${tiltY}deg)
                `,
                backgroundColor: activeGlowColor,
                borderRadius: `${settings.glowCornerRadius}px`,
                opacity: settings.fillOpacity,
                filter: 'none',
                transformOrigin: 'center center',
                transition: `transform ${settings.tiltReturnSpeed}s ease-out`,
                zIndex: -1
            }}
            />

            <div style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                marginLeft: `${-cardWidth / 2}px`,
                marginTop: `${-cardHeight / 2}px`,
                transform: `scale(${activeScale}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
                transformOrigin: 'center center',
                transformStyle: 'preserve-3d',
                transition: `transform ${settings.tiltReturnSpeed}s ease-out`,
                filter: shadowFilter,
            }}>
                {template ? (
                    <CardRenderer
                        template={template}
                        data={card}
                        schema={schema}
                        scale={settings.cardScale}
                        className="pointer-events-none origin-top-left"
                    />
                ) : null}

                {/* Tooltip during drag */}
                <CardTooltip
                    card={card}
                    settings={useGameStore.getState().boardSettings.handTooltipSettings}
                />
            </div>

        </div>
    );
};


