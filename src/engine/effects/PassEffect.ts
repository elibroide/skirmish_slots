import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId } from '../types';

/**
 * Handle a player passing their turn
 */
export class PassEffect extends Effect {
  constructor(private playerId: PlayerId) {
    super();
  }

  execute(state: GameState): EffectResult {
    const events = [];

    // Mark player as passed
    state.hasPassed[this.playerId] = true;

    events.push({
      type: 'PLAYER_PASSED' as const,
      playerId: this.playerId,
    });

    // Check if both players have passed
    if (state.hasPassed[0] && state.hasPassed[1]) {
      // Enqueue round resolution
      const { ResolveRoundEffect } = require('./ResolveRoundEffect');
      this.engine.enqueueEffect(new ResolveRoundEffect());
    } else {
      // Switch priority to opponent
      const opponent = (1 - this.playerId) as PlayerId;
      state.currentPlayer = opponent;

      events.push({
        type: 'PRIORITY_CHANGED' as const,
        newPriority: opponent,
      });
    }

    return { newState: state, events };
  }
}
