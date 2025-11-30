import { Effect } from './Effect';
import type { EffectResult, GameState } from '../types';
import { DrawCardEffect } from './DrawCardEffect';
import { GAME_CONSTANTS } from '../../utils/constants';

/**
 * Start a new round
 */
export class StartRoundEffect extends Effect {
  execute(state: GameState): EffectResult {
    const events = [];

    // Determine draw count
    const drawCount = state.currentRound === 1
      ? GAME_CONSTANTS.INITIAL_HAND_SIZE
      : GAME_CONSTANTS.SUBSEQUENT_HAND_SIZE;

    // Draw cards for both players
    for (let playerId = 0; playerId < 2; playerId++) {
      this.engine.enqueueEffect(new DrawCardEffect(playerId as 0 | 1, drawCount));
    }

    // Reset pass flags
    state.hasPassed = [false, false];

    // Reset VP for this round
    state.players[0].vp = 0;
    state.players[1].vp = 0;

    // Priority determined randomly on round 1, stays with last player otherwise
    // (Already set in initial state or by previous round)

    events.push({
      type: 'ROUND_STARTED' as const,
      roundNumber: state.currentRound,
    });

    return { newState: state, events };
  }
}
