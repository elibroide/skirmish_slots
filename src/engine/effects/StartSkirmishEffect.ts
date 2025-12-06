import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId } from '../types';
import { DrawCardEffect } from './DrawCardEffect';
import { GAME_CONSTANTS } from '../../utils/constants';

/**
 * Start a new skirmish
 */
export class StartSkirmishEffect extends Effect {
  async execute(state: GameState): Promise<EffectResult> {
    const events = [];

    // Determine draw count
    // First skirmish: draw 8 cards
    // Subsequent skirmishes: draw 3 additional cards
    const drawCount = state.currentSkirmish === 1
      ? GAME_CONSTANTS.INITIAL_HAND_SIZE  // 8 cards
      : GAME_CONSTANTS.CARDS_DRAWN_PER_SKIRMISH;  // 3 cards

    // Draw cards for both players
    for (const playerId of [0, 1] as PlayerId[]) {
      for (let i = 0; i < drawCount; i++) {
        this.engine.enqueueEffect(new DrawCardEffect(playerId));
      }
    }

    // Reset "done" flags
    state.isDone = [false, false];

    // Reset SP for this skirmish
    state.players[0].sp = 0;
    state.players[1].sp = 0;

    // Priority determined randomly on skirmish 1, stays with last player otherwise
    // (Already set in initial state or by previous skirmish)

    events.push({
      type: 'SKIRMISH_STARTED' as const,
      skirmishNumber: state.currentSkirmish,
    });

    return { newState: state, events };
  }
}
