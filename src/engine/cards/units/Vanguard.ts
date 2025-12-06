import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Vanguard (2 power)
 * Close allies get +1
 */
export class Vanguard extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('vanguard', 'Vanguard', 'Close allies get +1', 2, owner, engine);
  }

  async onDeploy(): Promise<void> {
    // Give +1 to all close allies
    const closeAllies = this.getCloseAllies();
    for (const ally of closeAllies) {
      ally.addPower(1);
    }
  }

  async onDeath(): Promise<void> {
    // Remove +1 from all close allies
    const closeAllies = this.getCloseAllies();
    for (const ally of closeAllies) {
      ally.addPower(-1);
    }
  }
}
