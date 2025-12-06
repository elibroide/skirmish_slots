import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Acolyte (1 power)
 * Consumed: Consuming unit gets +3
 */
export class Acolyte extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('acolyte', 'Acolyte', 'Consumed: Consuming unit gets +3', 1, owner, engine);
  }

  onConsumed(consumingUnit: UnitCard | null): void {
    // Give +3 to the unit that consumed this
    if (consumingUnit) {
      consumingUnit.addPower(3);
    }
  }
}
