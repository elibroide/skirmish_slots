import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId } from '../types';

/**
 * Draw cards from deck to hand
 */
export class DrawCardEffect extends Effect {
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
      // If deck is empty, skip draw
      if (player.deck.length === 0) {
        break;
      }

      const card = player.deck.pop()!;
      player.hand.push(card);

      events.push({
        type: 'CARD_DRAWN' as const,
        playerId: this.playerId,
        cardId: card.id,
        cardName: card.name,
      });
    }

    return { newState: state, events };
  }
}
