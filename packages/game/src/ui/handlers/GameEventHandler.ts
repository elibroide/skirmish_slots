import { GameEvent } from '@skirmish/engine';

export interface GameEventHandler {
    handle(event: GameEvent): Promise<void>;
}
