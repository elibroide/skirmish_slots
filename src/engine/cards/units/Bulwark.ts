import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Bulwark (4 power)
 * In front enemy gets -2
 */
export class Bulwark extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('bulwark', 'Bulwark', 'In front enemy gets -2', 4, owner, engine);
  }

  async onDeploy(): Promise<void> {
    // Give -2 to enemy in front
    const enemyInFront = this.getUnitInFront();
    if (enemyInFront) {
      enemyInFront.addPower(-2);
    }
  }

  async onDeath(): Promise<void> {
    // Remove -2 from enemy in front
    const enemyInFront = this.getUnitInFront();
    if (enemyInFront) {
      enemyInFront.addPower(2);
    }
  }
}
