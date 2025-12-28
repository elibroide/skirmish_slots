import { PlayerGameEntity } from './base/PlayerGameEntity';
export class Slot extends PlayerGameEntity {
    constructor(engine, terrainId, playerId) {
        super(engine, playerId);
        Object.defineProperty(this, "terrainId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "playerId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Use 'owner' from base? Or keep usage of 'playerId'?
        // Base has 'owner'. 'playerId' was likely 'owner' alias.
        // Let's keep 'playerId' getter or alias if code uses it widely.
        // Actually, let's keep it clean. If I extend PlayerGameEntity, I satisfy 'owner'.
        // But Slot.ts likely uses 'playerId'. I'll check.
        Object.defineProperty(this, "_unit", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "_modifier", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        this.terrainId = terrainId;
        this.playerId = playerId;
    }
    // Accessors
    get unit() { return this._unit; }
    get modifier() { return this._modifier; }
    // Mutators
    setUnit(unit) {
        this._unit = unit;
    }
    setModifier(value) {
        const oldModifier = this._modifier;
        this._modifier = value;
        if (oldModifier !== value) {
            this.engine.emitEvent({
                type: 'SLOT_MODIFIER_CHANGED',
                terrainId: this.terrainId, // Cast to TerrainId
                playerId: this.playerId,
                newModifier: value,
                entity: this
            });
        }
    }
    toState() {
        return {
            unit: this._unit ? this._unit.toState() : null,
            modifier: this._modifier
        };
    }
}
