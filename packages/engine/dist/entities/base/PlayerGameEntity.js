import { GameEntity } from './GameEntity';
/**
 * Base class for entities that are owned by a specific player.
 * Enables player-specific interactions like input requests.
 */
export class PlayerGameEntity extends GameEntity {
    constructor(engine, owner) {
        super(engine);
        Object.defineProperty(this, "owner", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.owner = owner;
    }
    /**
     * Request player input (targeting, modal choices, etc.)
     * This method suspends execution until player provides input.
     */
    requestInput(request) {
        return new Promise(async (resolve) => {
            // Store the resolve function FIRST so submitInput() can call it
            this.engine.pendingInputResolve = resolve;
            // THEN emit INPUT_REQUIRED event
            await this.engine.emitEvent({
                type: 'INPUT_REQUIRED',
                playerId: this.owner,
                inputRequest: request,
            });
        });
    }
}
