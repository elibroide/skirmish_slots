import { UnitCard } from './Card';
import type { PlayerId } from '../types';
import type { GameEngine } from '../GameEngine';

/**
 * Shock Trooper - Power 3
 * Deploy: Deal 1 damage to close enemies
 */
export class ShockTrooper extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('shock_trooper', 'Shock Trooper', 3, owner, engine);
  }

  onDeploy(): void {
    const enemies = this.getCloseEnemies();

    enemies.forEach((enemy) => {
      enemy.dealDamage(1);
    });
  }
}
