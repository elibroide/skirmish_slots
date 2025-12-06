import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Mimic (1 power)
 * Deploy: My power becomes equal to enemy in front of me
 */
export class Mimic extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('mimic', 'Mimic', 'Deploy: My power becomes equal to enemy in front of me', 1, owner, engine);
  }

  async onDeploy(): Promise<void> {
    // Copy power from enemy in front
    const enemyInFront = this.getUnitInFront();
    if (enemyInFront) {
      const powerDifference = enemyInFront.power - this.power;
      this.addPower(powerDifference);
    }
  }
}
