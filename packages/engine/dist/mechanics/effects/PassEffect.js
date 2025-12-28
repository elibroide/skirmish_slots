import { Effect } from './Effect';
import { TurnEndEffect } from './TurnEndEffect';
/**
 * Effect that handles a player passing.
 * Wraps the PASS action for consistent effect stack ordering.
 */
export class PassEffect extends Effect {
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
        // Check if player becomes "done" (locked out for the skirmish)
        // This happens if they haven't taken any action this turn
        const player = this.engine.getPlayer(this.playerId);
        // Player entity handles logic for determining if they are done
        await player.pass();
        // Queue the turn end effect
        this.engine.addInterrupt(new TurnEndEffect());
        return { newState: state, events };
    }
    getDescription() {
        return `PassEffect: Player ${this.playerId} passes`;
    }
}
