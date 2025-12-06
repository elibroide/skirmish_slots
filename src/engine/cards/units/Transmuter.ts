import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Transmuter (3 power)
 * Consumed: Close allies get +1
 */
export class Transmuter extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('transmuter', 'Transmuter', 'Consumed: Close allies get +1', 3, owner, engine);
  }

  onConsumed(consumingUnit: UnitCard | null): void {
    // Give +1 to all close allies
    const closeAllies = this.getCloseAllies();
    for (const ally of closeAllies) {
      ally.addPower(1);
    }
  }
}
