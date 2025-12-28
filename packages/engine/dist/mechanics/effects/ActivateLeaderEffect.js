import { Effect } from './Effect';
/**
 * Effect that handles leader ability activation.
 * Wraps the ACTIVATE_LEADER action for consistent effect stack ordering.
 */
export class ActivateLeaderEffect extends Effect {
    constructor(playerId) {
        super();
        Object.defineProperty(this, "playerId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: playerId
        });
    }
    async execute(state) {
        const events = [];
        // Delegate to Player entity
        await this.engine.getPlayer(this.playerId).activateLeader();
        return { newState: state, events };
    }
    getDescription() {
        return `ActivateLeaderEffect: Player ${this.playerId} activates leader ability`;
    }
}
