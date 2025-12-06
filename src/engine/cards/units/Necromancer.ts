import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';
import { ConsumeUnitEffect } from '../../effects';

/**
 * Necromancer (4 power)
 * Activate (2): Consume 2 allies. All close allies get +2.
 */
export class Necromancer extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('necromancer', 'Necromancer', 'Activate (2): Consume 2 allies. All close allies get +2.', 4, owner, engine);

    // Setup activate ability
    this.activateAbility = {
      cooldownMax: 2,
      cooldownRemaining: 0,
      description: 'Consume 2 allies. All close allies get +2.',
      activate: () => this.doActivate(),
    };
  }

  private doActivate(): void {
    // Find 2 allies to consume (prefer lowest power)
    const allies = this.engine.getPlayerUnits(this.owner).filter(u => u.id !== this.id);
    if (allies.length < 2) return;

    // Sort by power and consume the two weakest
    allies.sort((a, b) => a.power - b.power);
    const target1 = allies[0];
    const target2 = allies[1];

    // Consume both allies
    this.engine.enqueueEffect(new ConsumeUnitEffect(target1.id, this.id));
    this.engine.enqueueEffect(new ConsumeUnitEffect(target2.id, this.id));

    // Give +2 to all close allies
    const closeAllies = this.getCloseAllies();
    for (const ally of closeAllies) {
      ally.addPower(2);
    }
  }
}
