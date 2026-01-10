import { GameEvent } from '@skirmish/engine';
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
        }
    }
}
