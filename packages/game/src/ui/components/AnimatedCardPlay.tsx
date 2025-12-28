import React, { useEffect } from 'react';
import { motion, useAnimate } from 'framer-motion';
import { CardRenderer, CardInstance, CardTemplate, CardSchema } from '@skirmish/card-maker';
import { HandSettings, BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from './Card';
import { AnimationConfig } from '../../store/gameStore';

interface AnimatedCardPlayProps {
    card: CardInstance; // Direct dependency as requested
    startPosition: { x: number; y: number };
    targetPosition: { x: number; y: number };
    settings: HandSettings;
    animationConfig: AnimationConfig;
    templates: CardTemplate[];
    schema: CardSchema;
    triggerNext: () => void;
    onComplete: () => void;
}

export const AnimatedCardPlay: React.FC<AnimatedCardPlayProps> = ({
    card,
    startPosition,
    targetPosition,
    settings,
    animationConfig,
    templates,
    schema,
    triggerNext,
    onComplete
}) => {
    console.log('[AnimatedCardPlay] Component Rendered', { cardId: card?.id });
    const activeCard = card;
    const template = activeCard ? templates.find(t => t.id === activeCard.templateId) : null;

    const [scope, animate] = useAnimate();

    // Calculate dimensions
    const cardWidth = BASE_CARD_WIDTH * settings.cardScale;
    const cardHeight = BASE_CARD_HEIGHT * settings.cardScale;

    const hasStartedRef = React.useRef(false);

    useEffect(() => {
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;

        const runSequence = async () => {
            if (!scope.current) return;

            // Ensure initial state is set
            await animate(scope.current, {
                x: startPosition.x,
                y: startPosition.y,
                scale: settings.dragScale,
                opacity: 1,
                zIndex: 10000
            }, { duration: 0 });

            console.log('[AnimatedCardPlay] Sequence Starting', { startPosition, targetPosition });

            const centeredTargetX = targetPosition.x + cardWidth / 2;
            const centeredTargetY = targetPosition.y + cardHeight / 2;

            const hangingX = centeredTargetX + (animationConfig.hoverOffsetX || 0);
            const hangingY = centeredTargetY + (animationConfig.hoverOffsetY || 0);

            if (animationConfig.moveDuration > 0)
            {
                await animate(scope.current, {
                    x: hangingX,
                    y: hangingY,
                    scale: animationConfig.hoverScale
                }, {
                    duration: animationConfig.moveDuration,
                    ease: (animationConfig.moveEase || "easeOut") as any
                });
            } else
            {
                await animate(scope.current, {
                    x: hangingX,
                    y: hangingY,
                    scale: animationConfig.hoverScale
                }, { duration: 0 });
            }
            if (animationConfig.triggerNextOn === 'moveDone') triggerNext();

            if (animationConfig.triggerNextOn === 'hoverDone') triggerNext();

            await animate(scope.current, {
                x: centeredTargetX,
                y: centeredTargetY,
                scale: animationConfig.slamScaleLand,
                opacity: 0
            }, {
                duration: animationConfig.slamDuration,
                ease: (animationConfig.slamEase || "backIn") as any,
                delay: animationConfig.waitDuration // Use declarative delay instead of setTimeout
            });

            if (animationConfig.triggerNextOn === 'slamDone') triggerNext();

            onComplete();
        };

        runSequence();
    }, []);


    return (
        <motion.div
            ref={scope}
            initial={{
                x: startPosition.x,
                y: startPosition.y,
                scale: settings.dragScale, // Start from drag scale
                zIndex: 10000 // High z-index for animation
            }}
            // animate={controls} // Removed
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                transformOrigin: 'center center',
                pointerEvents: 'none'
            }}
        >
            {template && activeCard && (
                <CardRenderer
                    template={template}
                    data={activeCard}
                    schema={schema}
                    scale={settings.cardScale}
                    className="pointer-events-none origin-top-left"
                />
            )}
        </motion.div>
    );
};
