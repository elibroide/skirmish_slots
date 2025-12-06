import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId } from '../types';
import { ResolveSkirmishEffect } from './ResolveSkirmishEffect';

/**
 * Handle a player declaring done (was "passing")
 */
export class PassEffect extends Effect {
  constructor(private playerId: PlayerId) {
    super();
  }

  async execute(state: GameState): Promise<EffectResult> {
    const events = [];

    // Mark player as done
    state.isDone[this.playerId] = true;

    events.push({
      type: 'PLAYER_DONE' as const,
      playerId: this.playerId,
    });

    // Check if both players have declared done
    if (state.isDone[0] && state.isDone[1]) {
      // Both done - enqueue skirmish resolution (don't switch priority)
      this.engine.enqueueEffect(new ResolveSkirmishEffect());
    } else {
      // Only this player done - check if opponent has also declared done
      const opponent = (1 - this.playerId) as PlayerId;

      if (state.isDone[opponent]) {
        // Opponent already declared done earlier, both are done now
        // Enqueue skirmish resolution (don't switch priority)
        this.engine.enqueueEffect(new ResolveSkirmishEffect());
      } else {
        // Opponent hasn't declared done yet - switch priority to them
        state.currentPlayer = opponent;

        events.push({
          type: 'PRIORITY_CHANGED' as const,
          newPriority: opponent,
        });
      }
    }

    return { newState: state, events };
  }
}
