import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId } from '../types';

/**
 * Discard cards from hand
 */
export class DiscardCardEffect extends Effect {
  constructor(
    private playerId: PlayerId,
    private count: number
  ) {
    super();
  }

  execute(state: GameState): EffectResult {
    const events = [];
    const player = state.players[this.playerId];

    for (let i = 0; i < this.count; i++) {
      if (player.hand.length === 0) break;

      // Discard from end of hand
      const card = player.hand.pop()!;
      player.discard.push(card);

      events.push({
        type: 'CARD_DISCARDED' as const,
        playerId: this.playerId,
        cardId: card.id,
        cardName: card.name,
      });
    }

    return { newState: state, events };
  }
}
