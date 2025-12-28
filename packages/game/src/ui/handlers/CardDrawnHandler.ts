import { GameEvent } from '@skirmish/engine';
import { GameEventHandler } from './GameEventHandler';
import { useGameStore } from '../../store/gameStore';
import { hydrateCard } from '../utils/cardHydration';

export class CardDrawnHandler implements GameEventHandler {
    async handle(event: GameEvent): Promise<void> {
        if (event.type !== 'CARD_DRAWN') return;

        const { playerId, card } = event;
        
        // Use the full card data from the engine for hydration
        const hydratedCard = hydrateCard(card);

        // Add to store
        useGameStore.getState().addCardToHand(playerId, hydratedCard);
    }
}
