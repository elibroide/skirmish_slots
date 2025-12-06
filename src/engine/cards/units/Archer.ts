import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Archer (3 power)
 * Deploy: Deal 2 damage to a close enemy
 */
export class Archer extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('archer', 'Archer', 'Deploy: Deal 2 damage to a close enemy', 3, owner, engine);
  }

  async onDeploy(): Promise<void> {
    const closeEnemies = this.getCloseEnemies();

    if (closeEnemies.length === 0) {
      return;
    }

    // Request player to select a target
    const targetId = await this.requestInput({
      type: 'target',
      targetType: 'enemy_unit',
      validTargetIds: closeEnemies.map(u => u.id),
      context: 'Archer Deploy ability',
    });

    const target = this.engine.getUnitById(targetId);
    if (target) {
      target.dealDamage(2);
    }
  }
}
