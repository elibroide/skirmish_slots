import { UnitCard } from './Card';
import type { PlayerId } from '../types';
import type { GameEngine } from '../GameEngine';

/**
 * Champion - Power 5, no ability
 * A strong vanilla unit
 */
export class Champion extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('champion', 'Champion', 5, owner, engine);
  }
}
