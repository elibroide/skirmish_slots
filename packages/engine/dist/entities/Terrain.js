import { GameEntity } from './base/GameEntity';
import { Slot } from './Slot';
export class Terrain extends GameEntity {
    constructor(engine, id) {
        // Owner is irrelevant for Terrain
        super(engine);
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_slots", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_winner", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.id = id;
        this._slots = [
            new Slot(engine, id, 0),
            new Slot(engine, id, 1)
        ];
    }
    // Accessors
    get slots() { return this._slots; }
    get winner() { return this._winner; }
    // Mutators
    setWinner(winner) {
        this._winner = winner;
    }
    getSlot(playerId) {
        return this._slots[playerId];
    }
    toState() {
        return {
            id: this.id,
            slots: {
                0: this._slots[0].toState(),
                1: this._slots[1].toState()
            },
            winner: this._winner
        };
    }
}
