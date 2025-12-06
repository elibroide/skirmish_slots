import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Turret (3 power)
 * When your turn starts, deal 1 damage to enemy in front of me
 */
export class Turret extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('turret', 'Turret', 'When your turn starts, deal 1 damage to enemy in front of me', 3, owner, engine);
  }

  onTurnStart(): void {
    // Deal 1 damage to enemy in front
    const enemyInFront = this.getUnitInFront();
    if (enemyInFront) {
      enemyInFront.dealDamage(1);
    }
  }
}
