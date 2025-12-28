import { Effect } from './Effect';
/**
 * Resolves unit deaths identified by the StateChecker.
 * Executes the death sequence for multiple units.
 */
export class ResolveDeathsEffect extends Effect {
    constructor(dyingUnits) {
        super();
        Object.defineProperty(this, "dyingUnits", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: dyingUnits
        });
    }
    async execute(state) {
        const events = [];
        // Process deaths sequentially
        for (const unit of this.dyingUnits) {
            // Double check if unit is still on board and dead (state might have changed)
            if (unit.terrainId !== null && unit.power <= 0) {
                await unit.die('death');
            }
        }
        return { newState: state, events };
    }
}
