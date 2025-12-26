import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { CardRenderer, CardInstance, CardTemplate, CardSchema } from '@skirmish/card-maker';
import { HandSettings, BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from './Card';

interface SlammingCardProps {
    card: CardInstance;
    startPosition: { x: number; y: number };
    targetPosition: { x: number; y: number };
    settings: HandSettings;
    templates: CardTemplate[];
    schema: CardSchema;
    onComplete: () => void;
}

export const SlammingCard: React.FC<SlammingCardProps> = ({
    card,
    startPosition,
    targetPosition,
    settings,
    templates,
    schema,
    onComplete
}) => {
    const controls = useAnimation();
    const template = templates.find(t => t.id === card.templateId);

    const cardWidth = BASE_CARD_WIDTH * settings.cardScale;
    const cardHeight = BASE_CARD_HEIGHT * settings.cardScale;

    useEffect(() => {
        const sequence = async () => {
            // 1. Anticipation: Lift Up + Scale Up
            await controls.start({
                scale: settings.slamScalePeak,
                y: startPosition.y + settings.slamHeight, // e.g. -100px relative to stored position? No, absolute.
                // We start at startPosition.y. We want to go UP.
                // So we target startPosition.y + settings.slamHeight
                transition: {
                    duration: settings.slamDuration * 0.4,
                    ease: "easeOut"
                }
            });

            // 2. Slam: Drop to Target + Scale Down
            await controls.start({
                x: targetPosition.x,
                y: targetPosition.y,
                scale: settings.slamScaleLand,
                opacity: 0, // Fade out slightly at the very end or just poof
                transition: {
                    duration: settings.slamDuration * 0.6,
                    ease: "backIn" // The "Heavy" feel
                }
            });

            onComplete();
        };

        sequence();
    }, [controls, settings, startPosition, targetPosition, onComplete]);

    return (
        <motion.div
            initial={{
                x: startPosition.x,
                y: startPosition.y,
                scale: settings.dragScale, // Start at drag scale
                zIndex: 9999
            }}
            animate={controls}
            style={{
                position: 'fixed', // Fixed to screen
                left: 0,
                top: 0,
                marginLeft: `${-cardWidth / 2}px`, // Center pivot
                marginTop: `${-cardHeight / 2}px`,
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                transformOrigin: 'center center',
                pointerEvents: 'none'
            }}
        >
            {template && (
                <CardRenderer
                    template={template}
                    data={card}
                    schema={schema}
                    scale={settings.cardScale}
                    className="pointer-events-none origin-top-left"
                />
            )}
        </motion.div>
    );
};
