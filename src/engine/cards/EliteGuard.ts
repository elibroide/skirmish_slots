import { UnitCard } from './Card';
import type { PlayerId } from '../types';
import type { GameEngine } from '../GameEngine';

/**
 * Elite Guard - Power 4
 * Conquer: Gain 1 additional VP
 */
export class EliteGuard extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('elite_guard', 'Elite Guard', 4, owner, engine);
  }

  onConquer(): void {
    // Award additional VP
    this.engine.state.players[this.owner].vp += 1;
  }
}
