import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId, GameEvent } from '../types';

/**
 * Discard cards from hand to graveyard
 */
export class DiscardCardEffect extends Effect {
  constructor(
    private playerId: PlayerId,
    private count: number
  ) {
    super();
  }

  async execute(state: GameState): Promise<EffectResult> {
    const events: GameEvent[] = [];
    const player = state.players[this.playerId];

    for (let i = 0; i < this.count; i++) {
      if (player.hand.length === 0) break;

      // Discard from end of hand to graveyard
      const card = player.hand.pop()!;
      player.graveyard.push(card);

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
