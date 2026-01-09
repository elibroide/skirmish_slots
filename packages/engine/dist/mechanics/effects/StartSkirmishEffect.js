import { Effect } from './Effect';
import { TurnStartEffect } from './TurnStartEffect';
import { GAME_CONSTANTS } from '../../core/constants';
/**
 * Start a new skirmish
 */
export class StartSkirmishEffect extends Effect {
    async execute(state) {
        const events = [];
        // Determine draw count
        const drawCount = state.currentSkirmish === 1
            ? GAME_CONSTANTS.INITIAL_HAND_SIZE // 8 cards
            : GAME_CONSTANTS.CARDS_DRAWN_PER_SKIRMISH; // 3 cards
        // Draw cards for both players
        // Order: Player 0 draws, then Player 1 draws
        for (const playerId of [0, 1]) {
            const player = this.engine.getPlayer(playerId);
            await player.draw(drawCount);
        }
        // Reset "done" flags and turn action tracking
        // Reset SP for this skirmish
        for (const playerId of [0, 1]) {
            const player = this.engine.getPlayer(playerId);
            player.resetSkirmishFlags();
            player.resetSkirmishStats();
        }
        // Priority determined randomly on skirmish 1, stays with last player otherwise
        // (Already set in initial state or by previous skirmish)
        events.push({
            type: 'SKIRMISH_STARTED',
            skirmishNumber: state.currentSkirmish,
            hands: {
                0: this.engine.getPlayer(0).toState().hand,
                1: this.engine.getPlayer(1).toState().hand
            }
        });
        // Enqueue TurnStartEffect for the starting player
        // This happens AFTER all draws
        const sequence = [];
        sequence.push(new TurnStartEffect());
        this.engine.addSequence(sequence);
        return { newState: state, events };
    }
}
