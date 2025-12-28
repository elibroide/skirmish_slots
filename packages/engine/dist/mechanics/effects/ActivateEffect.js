import { Effect } from './Effect';
/**
 * Effect that handles unit ability activation.
 * Wraps the ACTIVATE action for consistent effect stack ordering.
 */
export class ActivateEffect extends Effect {
    constructor(playerId, unitId) {
        super();
        Object.defineProperty(this, "playerId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: playerId
        });
        Object.defineProperty(this, "unitId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: unitId
        });
    }
    async execute(state) {
        // Mark player as having acted this turn
        // Mark player as having acted this turn
        this.engine.getPlayer(this.playerId).markActed();
        // Find and activate the unit
        const unit = this.engine.getUnitById(this.unitId);
        if (unit) {
            await unit.activate();
        }
        // Events are emitted directly by unit.activate()
        return { newState: state, events: [] };
    }
    getDescription() {
        return `ActivateEffect: Player ${this.playerId} activates unit ${this.unitId}`;
    }
}
