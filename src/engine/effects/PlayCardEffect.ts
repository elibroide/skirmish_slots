import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId, TerrainId } from '../types';
import { UnitCard, ActionCard } from '../cards/Card';
import { DeployUnitEffect } from './DeployUnitEffect';
import { ConsumeUnitEffect } from './ConsumeUnitEffect';

/**
 * Play a card from hand
 */
export class PlayCardEffect extends Effect {
  constructor(
    private playerId: PlayerId,
    private cardId: string,
    private terrainId?: TerrainId,
    private targetUnitId?: string,
    private targetTerrainId?: TerrainId
  ) {
    super();
  }

  async execute(state: GameState): Promise<EffectResult> {
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
      terrainId: this.terrainId,
    });

    if (card instanceof UnitCard && this.terrainId !== undefined) {
      // Playing a unit card
      const terrain = state.terrains[this.terrainId];
      const existingUnit = terrain.slots[this.playerId].unit;

      // If slot occupied, consume existing unit first
      if (existingUnit) {
        this.engine.enqueueEffect(new ConsumeUnitEffect(existingUnit.id, null));
      }

      // Enqueue deploy effect
      this.engine.enqueueEffect(new DeployUnitEffect(card, this.terrainId));
    } else if (card instanceof ActionCard) {
      // Playing an action card
      // Determine target based on what was provided
      let target: unknown = undefined;
      if (this.targetUnitId) {
        target = this.targetUnitId;
      } else if (this.targetTerrainId !== undefined) {
        target = this.targetTerrainId;
      } else if (this.terrainId !== undefined) {
        // For action cards, terrainId can also be the target
        target = this.terrainId;
      }

      card.play(target);

      // Add to graveyard
      player.graveyard.push(card);
    }

    // Pass priority to opponent (unless player has declared done)
    if (!state.isDone[this.playerId]) {
      const opponent = (1 - this.playerId) as PlayerId;

      // Only give opponent priority if they haven't declared done
      if (!state.isDone[opponent]) {
        state.currentPlayer = opponent;

        events.push({
          type: 'PRIORITY_CHANGED' as const,
          newPriority: opponent,
        });
      }
      // If opponent has already declared done, both players are done - skirmish will resolve
    }

    return { newState: state, events };
  }
}
