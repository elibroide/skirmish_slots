import { GameEvent, SlotCoord, PlayerId } from '@skirmish/engine';
import { GameEventHandler } from './GameEventHandler';
import { useGameStore } from '../../store/gameStore';

export class ActionRequiredHandler implements GameEventHandler {
    constructor(private localPlayerId: number) {}

    async handle(event: GameEvent, pendingEvents: GameEvent[]): Promise<void> {
        if (event.type !== 'ACTION_REQUIRED') return;

        console.log(`[Handler] Action Required for Player ${event.playerId}. Pending Events: ${pendingEvents.length}`);
        
        const isLocal = event.playerId === this.localPlayerId;

        if (isLocal) {
            console.log('[Handler] Input Unlocked for Local Player');
            
            const store = useGameStore.getState();
            
            // Process legal actions to determine UI state
            const validTargets: Record<string, SlotCoord[]> = {};
            const playableCards = new Set<string>();
            const activatableUnits = new Set<string>();

            if (event.actions) {
                event.actions.forEach(action => {
                    if (action.type === 'PLAY_CARD') {
                        playableCards.add(action.cardId);
                        if (action.targetSlot) {
                            if (!validTargets[action.cardId]) validTargets[action.cardId] = [];
                            validTargets[action.cardId].push(action.targetSlot);
                        }
                    } else if (action.type === 'ACTIVATE') {
                        activatableUnits.add(action.unitId);
                    }
                });
            }

            store.setPlayableCards(Array.from(playableCards));
            store.setValidCardTargets(validTargets);
            store.setActivatableUnitIds(Array.from(activatableUnits));
            
            store.setPassMode('pass');

        }
    }
}
