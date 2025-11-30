import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId, SlotId } from '../types';
import { UnitCard, ActionCard } from '../cards/Card';
import { DeployUnitEffect } from './DeployUnitEffect';
import { SacrificeUnitEffect } from './SacrificeUnitEffect';

/**
 * Play a card from hand
 */
export class PlayCardEffect extends Effect {
  constructor(
    private playerId: PlayerId,
    private cardId: string,
    private slotId?: SlotId,
    private targetUnitId?: string,
    private targetSlotId?: SlotId
  ) {
    super();
  }

  execute(state: GameState): EffectResult {
    const events = [];
    const player = state.players[this.playerId];

    // Find and remove card from hand
    const cardIndex = player.hand.findIndex((c) => c.id === this.cardId);
    if (cardIndex === -1) {
      throw new Error(`Card ${this.cardId} not found in hand`);
    }

    const card = player.hand[cardIndex];
    player.hand.splice(cardIndex, 1);

    events.push({
      type: 'CARD_PLAYED' as const,
      playerId: this.playerId,
      cardId: card.id,
      cardName: card.name,
      slotId: this.slotId,
    });

    if (card instanceof UnitCard && this.slotId !== undefined) {
      // Playing a unit card
      const slot = state.slots[this.slotId];
      const existingUnit = slot.units[this.playerId];

      // If slot occupied, sacrifice existing unit first
      if (existingUnit) {
        this.engine.enqueueEffect(new SacrificeUnitEffect(existingUnit as UnitCard));
      }

      // Enqueue deploy effect
      this.engine.enqueueEffect(new DeployUnitEffect(card, this.slotId));
    } else if (card instanceof ActionCard) {
      // Playing an action card
      // Determine target based on what was provided
      let target: unknown = undefined;
      if (this.targetUnitId) {
        target = this.targetUnitId;
      } else if (this.targetSlotId !== undefined) {
        target = this.targetSlotId;
      }

      card.play(target);

      // Add to discard
      player.discard.push(card);
    }

    return { newState: state, events };
  }
}
