import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId, GameEvent } from '../types';

/**
 * Draw a single card from deck to hand
 */
export class DrawCardEffect extends Effect {
  constructor(
    private playerId: PlayerId
  ) {
    super();
  }

  async execute(state: GameState): Promise<EffectResult> {
    const events: GameEvent[] = [];
    const player = state.players[this.playerId];

    // If deck is empty, skip draw
    if (player.deck.length === 0) {
      return { newState: state, events };
    }

    const card = player.deck.pop()!;
    player.hand.push(card);

    events.push({
      type: 'CARD_DRAWN' as const,
      playerId: this.playerId,
      cardId: card.id,
      cardName: card.name,
    });

    return { newState: state, events };
  }
}
