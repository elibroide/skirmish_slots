/**
 * Base class for all effects in the game.
 * Effects encapsulate game actions that can be queued and executed.
 */
export class Effect {
    constructor() {
        Object.defineProperty(this, "engine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    /**
     * Set the engine reference (called by GameEngine when enqueueing)
     */
    setEngine(engine) {
        this.engine = engine;
    }
    /**
     * Optional: Get a description of this effect for debugging/logging
     */
    getDescription() {
        return this.constructor.name;
    }
}
