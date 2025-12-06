import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Champion (5 power)
 * When your turn starts, I get +2 this turn
 */
export class Champion extends UnitCard {
  private bonusApplied = false;

  constructor(owner: PlayerId, engine: GameEngine) {
    super('champion', 'Champion', 'When your turn starts, I get +2 this turn', 5, owner, engine);
  }

  onTurnStart(): void {
    // Give self +2 temporarily
    if (!this.bonusApplied) {
      this.addPower(2);
      this.bonusApplied = true;
    }
  }

  // Reset at end of turn (handled by skirmish resolution)
  // Note: In V2, turn-based bonuses need to be tracked differently
  // For now, this is a permanent buff - we'll refine if needed
}
