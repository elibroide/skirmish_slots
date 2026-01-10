import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { PlayerId } from '@skirmish/engine';
import { eventHandlerRegistry } from '../handlers/EventHandlerRegistry';
import { TurnStartedHandler } from '../handlers/TurnStartedHandler';
import { ActionRequiredHandler } from '../handlers/ActionRequiredHandler';
import { SkirmishStartedHandler } from '../handlers/SkirmishStartedHandler';

export const useEventProcessor = (localPlayerId: PlayerId) => {
    const queue = useGameStore(state => state.eventQueue);
    const consumeEvent = useGameStore(state => state.consumeEvent);
    
    // State for pending action events (waiting for a Context Event Consumer)
    const [pendingEvents, setPendingEvents] = useState<any[]>([]);

    // Register Context Handlers ONLY
    useEffect(() => {
        eventHandlerRegistry.register('TURN_STARTED', new TurnStartedHandler(localPlayerId));
        eventHandlerRegistry.register('SKIRMISH_STARTED', new SkirmishStartedHandler());
        eventHandlerRegistry.register('ACTION_REQUIRED', new ActionRequiredHandler(localPlayerId));
    }, [localPlayerId]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsReady(true);
    }, []);

    useEffect(() => {
        if (isProcessing) return;
        if (queue.length === 0) return;
        if (!isReady) return;

        const processNext = async () => {
            setIsProcessing(true);
            const event = queue[0];

            console.log(`[EventProcessor] Inspecting: ${event.type}`);

            try {
                const handler = eventHandlerRegistry.getHandler(event.type);
                
                if (handler) {
                    // Context Consumer found! 
                    // Pass the current event AND the accumulated pending events
                    console.log(`[EventProcessor] Consumer found for ${event.type}. Processing with ${pendingEvents.length} pending events.`);
                    await handler.handle(event, pendingEvents);
                    
                    // Clear pending buffer after consumption
                    setPendingEvents([]);
                } else {
                     // No handler = Action Event. Buffer it.
                     console.log(`[EventProcessor] Buffering Action Event: ${event.type}`);
                     setPendingEvents(prev => [...prev, event]);
                }
            } catch (e) {
                console.error("Error processing event", e);
            }

            consumeEvent(); // Remove from main queue
            setIsProcessing(false);
        };

        processNext();

    }, [queue, isProcessing, consumeEvent, isReady, pendingEvents]);
};
