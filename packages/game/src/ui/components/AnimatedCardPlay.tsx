import React, { useEffect, useState } from 'react';
import { motion, useAnimation, Variants } from 'framer-motion';
import { CardRenderer, CardInstance, CardTemplate, CardSchema } from '@skirmish/card-maker';
import { HandSettings, BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from './Card';
import { AnimationConfig } from '../../store/gameStore';

interface AnimatedCardPlayProps {
    card: CardInstance;
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
    const controls = useAnimation();
    const template = templates.find(t => t.id === card.templateId);

    // Calculate dimensions
    const cardWidth = BASE_CARD_WIDTH * settings.cardScale;
    const cardHeight = BASE_CARD_HEIGHT * settings.cardScale;

    useEffect(() => {
        const runSequence = async () => {
            // 0. Initial State (handled by motion.div initial)

            // Check Start Trigger handled by Manager, but safe to check here if logic was local? 
            // Manager handles 'start', we handle phases.

            // 1. Move Phase (New)
            // Travel to the "Hanging Position" (target + hoverOffset)
            const hangingX = targetPosition.x + (animationConfig.hoverOffsetX || 0);
            const hangingY = targetPosition.y + (animationConfig.hoverOffsetY || 0);

            if (animationConfig.moveDuration > 0)
            {
                await controls.start({
                    x: hangingX,
                    y: hangingY,
                    scale: animationConfig.hoverScale,
                    transition: {
                        duration: animationConfig.moveDuration,
                        ease: (animationConfig.moveEase || "easeOut") as any
                    }
                });
            } else
            {
                // Instant move (set) if duration is 0
                controls.set({
                    x: hangingX,
                    y: hangingY,
                    scale: animationConfig.hoverScale
                });
            }
            if (animationConfig.triggerNextOn === 'moveDone') triggerNext();

            // 2. Hover Phase
            // We are already at hanging position. We just wait here? 
            // Or if we instant moved, we are here.
            // If hoverDuration > 0, we can add a subtle idle or just wait.
            // For now, it's just a wait/hold at the hanging position.

            // 2. Wait Phase (Implicit in flow now)
            if (animationConfig.waitDuration > 0)
            {
                await new Promise(resolve => setTimeout(resolve, animationConfig.waitDuration * 1000));
            }

            if (animationConfig.triggerNextOn === 'hoverDone') triggerNext();


            // Trigger check? Usually wait is part of hover logic conceptually, but config has it valid.
            // Let's assume passed if hoverDone passed.

            // 4. Slam Phase
            await controls.start({
                x: targetPosition.x,
                y: targetPosition.y,
                scale: animationConfig.slamScaleLand,
                opacity: 0, // Fade out on impact or just slam? Previously opacity 0 was landing? 
                // Ah, looking at previous code: opacity: 0 was in the slam transition?? 
                // Wait, if opacity is 0, the card vanishes? 
                // Yes, because onComplete -> occupySlot -> Board renders it. 
                // So the animation "hands off" to the board.
                transition: {
                    duration: animationConfig.slamDuration,
                    ease: (animationConfig.slamEase || "backIn") as any
                }
            });

            if (animationConfig.triggerNextOn === 'slamDone') triggerNext();

            onComplete();
        };

        runSequence();
    }, []);

    return (
        <motion.div
            initial={{
                x: startPosition.x,
                y: startPosition.y,
                scale: settings.dragScale, // Start from drag scale
                zIndex: 10000 // High z-index for animation
            }}
            animate={controls}
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                marginLeft: `${-cardWidth / 2}px`,
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
