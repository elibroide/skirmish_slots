import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Roots (2 power)
 * Death: My slot gets bonus equal to my power
 */
export class Roots extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('roots', 'Roots', 'Death: My slot gets bonus equal to my power', 2, owner, engine);
  }

  async onDeath(): Promise<void> {
    // Add slot modifier equal to current power
    if (this.terrainId !== null) {
      this.engine.addSlotModifier(this.terrainId, this.owner, this.power);
    }
  }
}
