import React from 'react';
import { HandSettings, BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from './Card';
import { CardRenderer, CardInstance, CardTemplate, CardSchema } from '@skirmish/card-maker';

interface DraggedCardProps {
    card: CardInstance;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    settings: HandSettings;
    templates: CardTemplate[];
    schema: CardSchema;
}

export const DraggedCard: React.FC<DraggedCardProps> = ({ card, position, velocity, settings, templates, schema }) => {
    // Calculate tilt based on velocity
    const maxTilt = settings.tiltMaxAngle;
    const tiltSensitivity = settings.tiltSensitivity;

    const tiltX = Math.max(-maxTilt, Math.min(maxTilt, -velocity.y * tiltSensitivity));
    const tiltY = Math.max(-maxTilt, Math.min(maxTilt, velocity.x * tiltSensitivity));

    const template = templates.find(t => t.id === card.templateId);

    // Dynamic Dimensions
    const cardWidth = BASE_CARD_WIDTH * settings.cardScale;
    const cardHeight = BASE_CARD_HEIGHT * settings.cardScale;

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
            <div style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                marginLeft: `${-cardWidth / 2}px`,
                marginTop: `${-cardHeight / 2}px`,
                transform: `scale(${settings.dragScale}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
                transformOrigin: 'center center',
                transformStyle: 'preserve-3d',
                transition: `transform ${settings.tiltReturnSpeed}s ease-out`,
                filter: 'drop-shadow(0 30px 50px rgba(0,0,0,0.6))',
                // Center content
                // display: 'flex', // REMOVED
                // alignItems: 'flex-start', 
                // justifyContent: 'center',
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
            </div>

        </div>
    );
};


