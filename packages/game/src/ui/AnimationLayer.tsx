import React, { useEffect, useState } from 'react';
import { AnimationManager, AnimationTask } from '../engine/AnimationManager';
import { ANIMATION_COMPONENTS } from './animations/registry';
import { HandSettings } from './components/Card';
import { CardInstance, CardTemplate, CardSchema } from '@skirmish/card-maker';

interface AnimationLayerProps {
    settings: HandSettings;
    templates: CardTemplate[];
    schema: CardSchema;
}

export const AnimationLayer: React.FC<AnimationLayerProps> = ({
    settings,
    templates,
    schema
}) => {
    const [activeTasks, setActiveTasks] = useState<AnimationTask[]>([]);

    useEffect(() => {
        const manager = AnimationManager.getInstance();
        const unsubscribe = manager.subscribe((tasks) => {
            setActiveTasks(tasks);
        });
        return unsubscribe;
    }, []);

    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
            {activeTasks.map((task: AnimationTask) => {
                const Component = ANIMATION_COMPONENTS[task.type];

                if (!Component)
                {
                    console.warn(`[AnimationLayer] Unknown animation type: ${task.type}`);
                    return null;
                }

                // Generic Props Passing
                // We assume all registered components accept a standardized set of props + specific payload
                return (
                    <Component
                        key={task.id}
                        {...task.payload} // Spread flexible payload (card, startPos, targetPos, unitId, etc.)
                        animationConfig={task.config} // Standard config from Manager
                        settings={settings} // Global Context
                        templates={templates} // Global Context
                        schema={schema} // Global Context
                        triggerNext={() => AnimationManager.getInstance().triggerNext(task.id)} // New Event Callback
                        onComplete={() => {
                            // Logic Hook: Execute any logic passed in payload (e.g., occupySlot)
                            if (task.payload && typeof task.payload.onFinish === 'function')
                            {
                                task.payload.onFinish();
                            }
                            AnimationManager.getInstance().complete(task.id);
                        }}
                    />
                );
            })}
        </div>
    );
};
