import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { PlayerId } from '@skirmish/engine';
import { eventHandlerRegistry } from '../handlers/EventHandlerRegistry';
import { CardPlayedHandler } from '../handlers/CardPlayedHandler';
import { CardDrawnHandler } from '../handlers/CardDrawnHandler';
import { UnitDiedHandler } from '../handlers/UnitDiedHandler';
import { TurnChangedHandler } from '../handlers/TurnChangedHandler';

import { SkirmishStartedHandler } from '../handlers/SkirmishStartedHandler';

export const useEventProcessor = (localPlayerId: PlayerId) => {
    const queue = useGameStore(state => state.eventQueue);
    const consumeEvent = useGameStore(state => state.consumeEvent);
    
    // One-time registration (idempotent registry)
    useEffect(() => {
        eventHandlerRegistry.register('CARD_PLAYED', new CardPlayedHandler(localPlayerId));
        eventHandlerRegistry.register('CARD_DRAWN', new CardDrawnHandler());
        eventHandlerRegistry.register('UNIT_DIED', new UnitDiedHandler());
        eventHandlerRegistry.register('TURN_CHANGED', new TurnChangedHandler(localPlayerId));
        eventHandlerRegistry.register('SKIRMISH_STARTED', new SkirmishStartedHandler());
    }, [localPlayerId]);

    const [hasStarted, setHasStarted] = useState(() => {
        const gs = useGameStore.getState().gameState;
        return (gs?.currentSkirmish || 0) > 0;
    });
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isProcessing) return;
        if (queue.length === 0) return;

        const processNext = async () => {
            setIsProcessing(true);
            const event = queue[0];
            
            // SUPPRESS EVENTS BEFORE SKIRMISH START
            // Logic: 
            // 1. If not started and event is NOT SKIRMISH_STARTED -> Ignore (consume and return)
            // 2. If event IS SKIRMISH_STARTED -> Set started, let Handler process it, Consume
            // 3. If started -> Process normally

            if (!hasStarted) {
                if (event.type === 'SKIRMISH_STARTED') {
                    console.log('[EventProcessor] Skirmish Started - Enabling Event Processing');
                    setHasStarted(true);
                    
                    // Allow this event to be processed by the handler (which does the syncing)
                } else {
                    console.log(`[EventProcessor] Ignoring pre-skirmish event: ${event.type}`);
                    consumeEvent();
                    setIsProcessing(false);
                    return;
                }
            }

            console.log(`[EventProcessor] Processing: ${event.type}`);

            try {
                const handler = eventHandlerRegistry.getHandler(event.type);
                if (handler) {
                    await handler.handle(event);
                } else {
                    // Fallback or ignore
                    if (event.type === 'INPUT_REQUIRED') {
                        // TODO: Enter targeting mode
                    }
                }
            } catch (e) {
                console.error("Error processing event", e);
            }

            // Done
            consumeEvent();
            setIsProcessing(false);
        };

        processNext();

    }, [queue, isProcessing, consumeEvent, hasStarted]);
};
