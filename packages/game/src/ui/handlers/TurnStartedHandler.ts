import { GameEvent, TurnStartedEvent } from '@skirmish/engine';
import { GameEventHandler } from './GameEventHandler';
import { useGameStore } from '../../store/gameStore';

export class TurnStartedHandler implements GameEventHandler {
    constructor(private localPlayerId: number) {}

    async handle(event: GameEvent, pendingEvents: GameEvent[]): Promise<void> {
        if (event.type !== 'TURN_STARTED') return;

        const turnEvent = event as TurnStartedEvent;
    }
}
