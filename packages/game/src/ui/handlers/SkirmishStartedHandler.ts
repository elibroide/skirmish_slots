import { GameEvent } from '@skirmish/engine';
import { GameEventHandler } from './GameEventHandler';
import { useGameStore } from '../../store/gameStore';
import { hydrateCard } from '../utils/cardHydration';

export class SkirmishStartedHandler implements GameEventHandler {
    async handle(event: GameEvent, pendingEvents: GameEvent[]): Promise<void> {
        if (event.type !== 'SKIRMISH_STARTED') return;

        console.log(`[Handler] Skirmish Started - Consumption Phase. Pending Events: ${pendingEvents.length}`);

        const store = useGameStore.getState();
        
        for (const pending of pendingEvents) {
            if (pending.type === 'CARDS_DRAWN') {
                 console.log(`[Handler] Consuming CARDS_DRAWN for Player ${pending.playerId} (Count: ${pending.cards.length})`);
                 
                 for (const cardState of pending.cards) {
                     const cardInstance = hydrateCard(cardState);
                     store.addCardToHand(pending.playerId, cardInstance);
                 }
            }
        }

        console.log('[Handler] Skirmish Consumption Complete.');
        useGameStore.getState().setGameStarted(true);

        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}
