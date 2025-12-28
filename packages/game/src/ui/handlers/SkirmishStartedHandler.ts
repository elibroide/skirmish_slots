import { GameEvent } from '@skirmish/engine';
import { GameEventHandler } from './GameEventHandler';
import { useGameStore } from '../../store/gameStore';

export class SkirmishStartedHandler implements GameEventHandler {
    async handle(event: GameEvent): Promise<void> {
        if (event.type !== 'SKIRMISH_STARTED') return;

        console.log('[Handler] Skirmish Started - Syncing Hands');

        console.log('[Handler] Skirmish Started - Syncing Hands from Event');
        
        // Sync hands from event payload
        const { hands } = event as any; // Type assertion needed until full TS propagation or redundant if generic handles it
        if (hands) {
            console.log(`[Handler] P0 Hand Size: ${hands[0]?.length}`);
            useGameStore.getState().syncHandFromEngine(0, hands[0]);
            useGameStore.getState().syncHandFromEngine(1, hands[1]);
        } else {
            console.error('[Handler] No hands data in SKIRMISH_STARTED event');
        }
    }
}
