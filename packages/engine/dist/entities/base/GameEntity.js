/**
 * Base class for all game entities that can interact with the engine.
 */
export class GameEntity {
    constructor(engine) {
        Object.defineProperty(this, "engine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.engine = engine;
    }
}
