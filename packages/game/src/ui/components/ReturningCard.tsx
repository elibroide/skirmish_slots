import React, { useState, useEffect } from 'react';
import { HandSettings, BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from './Card';
import { CardRenderer, CardInstance, CardTemplate, CardSchema } from '@skirmish/card-maker';

interface ReturningCardProps {
    card: CardInstance;
    fromPosition: { x: number; y: number };
    targetPosition: { x: number; y: number };
    rotation: number;
    onComplete: () => void;
    settings: HandSettings;
    templates: CardTemplate[];
    schema: CardSchema;
}

export const ReturningCard: React.FC<ReturningCardProps> = ({
    card,
    fromPosition,
    targetPosition,
    rotation,
    onComplete,
    settings,
    templates,
    schema
}) => {
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setHasStarted(true);
            });
        });

        const timer = setTimeout(() => {
            onComplete();
        }, settings.returnDuration * 1000 + 30);

        return () => clearTimeout(timer);
    }, [onComplete, settings.returnDuration]);

    const deltaX = targetPosition.x - fromPosition.x;
    const deltaY = targetPosition.y - fromPosition.y;

    const template = templates.find(t => t.id === card.templateId);

    // Dynamic Dimensions
    const cardWidth = BASE_CARD_WIDTH * settings.cardScale;
    const cardHeight = BASE_CARD_HEIGHT * settings.cardScale;

    return (
        <div
            style={{
                position: 'fixed',
                left: `${fromPosition.x}px`,
                top: `${fromPosition.y}px`,
                zIndex: 999,
                pointerEvents: 'none',
                transform: hasStarted
                    ? `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg) scale(1)`
                    : `translate(0, 0) rotate(0deg) scale(${settings.dragScale})`,
                transition: hasStarted ? `transform ${settings.returnDuration}s cubic-bezier(0.34, ${settings.returnSpringiness}, 0.64, 1)` : 'none',
            }}
        >
            <div style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                marginLeft: `${-cardWidth / 2}px`,
                marginTop: `${-cardHeight / 2}px`,
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
                // Center content
                // display: 'flex',
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


