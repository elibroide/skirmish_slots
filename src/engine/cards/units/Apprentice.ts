import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';
import { DrawCardEffect, ConsumeUnitEffect } from '../../effects';

/**
 * Apprentice (3 power)
 * Activate (2): Consume an ally. Draw a card.
 */
export class Apprentice extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('apprentice', 'Apprentice', 'Activate (2): Consume an ally. Draw a card.', 3, owner, engine);

    // Setup activate ability
    this.activateAbility = {
      cooldownMax: 2,
      cooldownRemaining: 0,
      description: 'Consume an ally. Draw a card.',
      activate: () => this.doActivate(),
    };
  }

  private doActivate(): void {
    // Find an ally to consume (prefer lowest power)
    const allies = this.engine.getPlayerUnits(this.owner).filter(u => u.id !== this.id);
    if (allies.length === 0) return;

    // Sort by power and consume the weakest
    allies.sort((a, b) => a.power - b.power);
    const targetAlly = allies[0];

    // Consume the ally
    this.engine.enqueueEffect(new ConsumeUnitEffect(targetAlly.id, this.id));

    // Draw a card
    this.engine.enqueueEffect(new DrawCardEffect(this.owner));
  }
}
