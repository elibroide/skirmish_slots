import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';
import { ConsumeUnitEffect } from '../../effects';

/**
 * Ritual Sacrifice (5 power)
 * Activate (1): Consume an ally. All close allies get +2.
 */
export class RitualSacrifice extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('ritual_sacrifice', 'Ritual Sacrifice', 'Activate (1): Consume an ally. All close allies get +2.', 5, owner, engine);

    // Setup activate ability
    this.activateAbility = {
      cooldownMax: 1,
      cooldownRemaining: 0,
      description: 'Consume an ally. All close allies get +2.',
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

    // Give +2 to all close allies
    const closeAllies = this.getCloseAllies();
    for (const ally of closeAllies) {
      ally.addPower(2);
    }
  }
}
