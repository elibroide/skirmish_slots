import React, { useEffect, useState } from 'react';
import { AnimationTask, useAnimationStore } from '../store/animationStore';
import { ANIMATION_COMPONENTS } from './animations/registry';
import { HandSettings } from './components/Card';
import { CardInstance, CardTemplate, CardSchema } from '@skirmish/card-maker';

interface AnimationLayerProps {
    settings: HandSettings;
    templates: CardTemplate[];
    schema: CardSchema;
}

const AnimationLayerComponent: React.FC<AnimationLayerProps> = ({
    settings,
    templates,
    schema
}) => {
    const activeTasks = useAnimationStore(state => state.activeTasks);
    // No need for explicit subscription, zustand handles it

    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
            {activeTasks.map((task: AnimationTask) => {
                const Component = ANIMATION_COMPONENTS[task.type];
                console.log(`[AnimationLayer] Rendering Task ${task.id} (${task.type}) -> Component found: ${!!Component}`);

                if (!Component)
                {
                    console.warn(`[AnimationLayer] Unknown animation type: ${task.type}`);
                    return null;
                }

                return (
                    <Component
                        key={task.id}
                        {...task.payload} // Spread flexible payload (card, startPos, targetPos, unitId, etc.)
                        animationConfig={task.config} // Standard config from Manager
                        settings={settings} // Global Context
                        templates={templates} // Global Context
                        schema={schema} // Global Context
                        triggerNext={() => useAnimationStore.getState().triggerNext(task.id)} // New Event Callback
                        onComplete={() => {
                            // Logic Hook: Execute any logic passed in payload (e.g., occupySlot)
                            if (task.payload && typeof task.payload.onFinish === 'function')
                            {
                                task.payload.onFinish();
                            }
                            useAnimationStore.getState().complete(task.id);
                        }}
                    />
                );
            })}
        </div>
    );
};

export const AnimationLayer = React.memo(AnimationLayerComponent, (prev, next) => {
    // Custom comparison if needed, but shallow verify is usually fine for stable objects.
    // Assuming settings/templates/schema change rarely.
    return prev.settings === next.settings &&
        prev.templates === next.templates &&
        prev.schema === next.schema;
});
