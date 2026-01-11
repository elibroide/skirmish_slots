import { GameEvent, TurnStartedEvent } from '@skirmish/engine';
import { GameEventHandler } from './GameEventHandler';
import { useGameStore } from '../../store/gameStore';

export class TurnStartedHandler implements GameEventHandler {
    constructor(private localPlayerId: number) {}

    async handle(event: GameEvent, pendingEvents: GameEvent[]): Promise<void> {
        if (event.type !== 'TURN_STARTED') return;

        const turnEvent = event as TurnStartedEvent;
        const store = useGameStore.getState();

        console.log(`[TurnStartedHandler] Turn Started for Player ${turnEvent.playerId}`);

        // Update turn status for the specific player
        store.setPlayerTurnStatus(turnEvent.playerId, 'turn');
        
        // If other player, set them to waiting/none if needed? 
        // Actually, BoardConfig has 'none' | 'turn' | 'done' | 'last_say'.
        // So we just set the active player to 'turn'.
        
        // Update global turn state if it's the local player
        if (turnEvent.playerId === this.localPlayerId) {
            store.setTurn('player');
            store.setPassMode('none'); // Reset pass button, wait for ActionRequired
        } else {
            store.setTurn('opponent');
            store.setPassMode('none');
        }
    }
}
