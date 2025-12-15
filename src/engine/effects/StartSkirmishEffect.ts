import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId } from '../types';
import { TurnStartEffect } from './TurnStartEffect';
import { GAME_CONSTANTS } from '../../utils/constants';

/**
 * Start a new skirmish
 */
export class StartSkirmishEffect extends Effect {
  async execute(state: GameState): Promise<EffectResult> {
    const events = [];

    // Determine draw count
    const drawCount = state.currentSkirmish === 1
      ? GAME_CONSTANTS.INITIAL_HAND_SIZE  // 8 cards
      : GAME_CONSTANTS.CARDS_DRAWN_PER_SKIRMISH;  // 3 cards

    // Draw cards for both players
    // Order: Player 0 draws, then Player 1 draws
    for (const playerId of [0, 1] as PlayerId[]) {
      const player = this.engine.getPlayer(playerId);
      await player.draw(drawCount);
    }

    // Reset "done" flags and turn action tracking
    state.isDone = [false, false];
    state.hasActedThisTurn = [false, false];
    state.hasPlayedCardThisTurn = [false, false];

    // Reset SP for this skirmish
    state.players[0].sp = 0;
    state.players[1].sp = 0;

    // Priority determined randomly on skirmish 1, stays with last player otherwise
    // (Already set in initial state or by previous skirmish)

    events.push({
      type: 'SKIRMISH_STARTED' as const,
      skirmishNumber: state.currentSkirmish,
    });

    // Enqueue TurnStartEffect for the starting player
    // This happens AFTER all draws
    const sequence: Effect[] = [];
    sequence.push(new TurnStartEffect());
    this.engine.addSequence(sequence);

    return { newState: state, events };
  }
}
