import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId, SlotCoord } from '../types';

/**
 * Effect that handles playing a card from hand.
 * Wraps the PLAY_CARD action for consistent effect stack ordering.
 */
export class PlayCardEffect extends Effect {
  constructor(
    private playerId: PlayerId,
    private cardId: string,
    private targetSlot?: SlotCoord
  ) {
    super();
  }

  async execute(state: GameState): Promise<EffectResult> {
    // Mark player as having acted this turn and played a card
    state.hasActedThisTurn[this.playerId] = true;
    state.hasPlayedCardThisTurn[this.playerId] = true;

    // Get player and play the card
    const player = this.engine.getPlayer(this.playerId);
    await player.playCard(this.cardId, this.targetSlot);

    // Events are emitted directly by player.playCard() and card logic
    return { newState: state, events: [] };
  }

  getDescription(): string {
    return `PlayCardEffect: Player ${this.playerId} plays card ${this.cardId}`;
  }
}
