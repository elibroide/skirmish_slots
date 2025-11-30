import { UnitCard } from './Card';
import type { PlayerId } from '../types';
import type { GameEngine } from '../GameEngine';

/**
 * Martyr - Power 2
 * Death: Give close allies +2 power
 */
export class Martyr extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('martyr', 'Martyr', 2, owner, engine);
  }

  onDeath(): void {
    const allies = this.getCloseAllies();

    allies.forEach((ally) => {
      ally.addPower(2);
    });
  }
}
