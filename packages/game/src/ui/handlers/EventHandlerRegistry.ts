import { GameEvent } from '@skirmish/engine';
import { GameEventHandler } from './GameEventHandler';

export class EventHandlerRegistry {
    private handlers: Map<string, GameEventHandler> = new Map();

    register(eventType: string, handler: GameEventHandler) {
        this.handlers.set(eventType, handler);
    }

    getHandler(eventType: string): GameEventHandler | undefined {
        return this.handlers.get(eventType);
    }
}

export const eventHandlerRegistry = new EventHandlerRegistry();
