import { GameEvent } from '@skirmish/engine';
import { GameEventHandler } from './GameEventHandler';
import { useGameStore } from '../../store/gameStore';

export class TurnChangedHandler implements GameEventHandler {
    constructor(private localPlayerId: number) {}

    async handle(event: GameEvent): Promise<void> {
        if (event.type !== 'TURN_CHANGED') return;

        const isPlayerTurn = event.playerId === this.localPlayerId;
        useGameStore.getState().setTurn(isPlayerTurn ? 'player' : 'opponent');
    }
}
