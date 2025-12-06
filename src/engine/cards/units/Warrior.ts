import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Warrior (2 power)
 * Basic unit with no special abilities
 */
export class Warrior extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('warrior', 'Warrior', 'No special ability', 2, owner, engine);
  }
}
