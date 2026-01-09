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

            // targetPosition is now the absolute center of the slot
            const centeredTargetX = targetPosition.x;
            const centeredTargetY = targetPosition.y;

            // Simple Push Animation
            // Move directly to target and scale down
            await animate(scope.current, {
                x: centeredTargetX,
                y: centeredTargetY,
                scale: animationConfig.slamScaleLand || 0.25, // Fallback to safe scale
                opacity: 0
            }, {
                duration: animationConfig.slamDuration || 0.4,
                ease: "backOut" // Push feel
            });

            if (animationConfig.triggerNextOn === 'slamDone' || animationConfig.triggerNextOn === 'moveDone') triggerNext();

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
                marginLeft: `-${cardWidth / 2}px`,
                marginTop: `-${cardHeight / 2}px`,
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
