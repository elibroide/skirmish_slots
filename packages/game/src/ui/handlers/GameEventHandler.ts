import { GameEvent } from '@skirmish/engine';

export interface GameEventHandler {
    handle(event: GameEvent, pendingEvents: GameEvent[]): Promise<void>;
}
