import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Soldier (4 power)
 * Basic unit with no special abilities
 */
export class Soldier extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('soldier', 'Soldier', 'No special ability', 4, owner, engine);
  }
}
