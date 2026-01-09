import { GameEvent } from '@skirmish/engine';
import { GameEventHandler } from './GameEventHandler';
import { useGameStore } from '../../store/gameStore';
import { useAnimationStore } from '../../store/animationStore';
import { hydrateCard } from '../utils/cardHydration';

export class CardPlayedHandler implements GameEventHandler {
    constructor(private localPlayerId: number) {}

    async handle(event: GameEvent): Promise<void> {
        if (event.type !== 'CARD_PLAYED') return;

        const { playerId, cardId, cardName, cardType, targetSlot } = event;
        const isLocal = playerId === this.localPlayerId;
        
        const settings = useGameStore.getState().boardSettings;
        const config = isLocal ? settings.animationSettings.playerPlay : settings.animationSettings.opponentPlay;
        const hand = useGameStore.getState().players[playerId].hand;
        let cardInstance = hand.find(c => c.id === cardId);

        // Helper to hydrate card if missing (e.g. from opponent)
        if (!cardInstance) {
            const mockEngineCard = {
                id: cardId, // Or 'anim-' + crypto if completely new, but typically we want to match engine event ID
                cardId: cardName, 
                name: cardName,
                description: '',
                getType: () => cardType || 'unit',
                power: 0
            } as any;
            cardInstance = hydrateCard(mockEngineCard);
        }

        // Allow components to hydrate/fallback if cardInstance is missing
        await useAnimationStore.getState().play({
            id: crypto.randomUUID(),
            type: 'card_play',
            config: config,
            payload: {
                cardId,
                playerId,
                targetSlot,
                isLocal,
                startPosition: (() => {
                    // 1. Check if we have a pending drop (from User Drag)
                    const pending = useAnimationStore.getState().getPendingDrop(cardId);
                    if (pending) {
                        return pending;
                    }

                    // 2. Fallback: Try DOM lookup
                    if (isLocal) {
                        const el = document.querySelector(`[data-card-id="${cardId}"]`);
                        if (el) {
                            const rect = el.getBoundingClientRect();
                            return { x: rect.left, y: rect.top };
                        }
                        return { x: settings.boardX + (settings.animationSettings.playerPlay.hoverOffsetX || 0), y: window.innerHeight };
                    } 
                    return { x: settings.boardX, y: -200 };
                })(),
                targetPosition: targetSlot ? (() => {
                    const slot = useGameStore.getState().players[playerId].slots[targetSlot.terrainId];
                    if (!slot) return { x: 0, y: 0 };
                    
                    // Return absolute center of the slot
                    return {
                        x: slot.x + (slot.width / 2),
                        y: slot.y + (slot.height / 2)
                    };
                })() : { x: 0, y: 0 },
                
                card: cardInstance,
                cardName, 
                cardType,
                onFinish: () => {
                    if (targetSlot) {
                        useGameStore.getState().occupySlot(playerId, targetSlot.terrainId, cardId, cardInstance);
                        useGameStore.getState().removeCardFromHand(playerId, cardId);
                    }
                }
            }
        });
    }
}
