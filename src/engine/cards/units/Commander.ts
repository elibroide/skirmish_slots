import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Commander (6 power)
 * When your turn starts, a close ally gets +2 this turn
 */
export class Commander extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('commander', 'Commander', 'When your turn starts, a close ally gets +2 this turn', 6, owner, engine);
  }

  onTurnStart(): void {
    // Give +2 to a random close ally
    const closeAllies = this.getCloseAllies();
    if (closeAllies.length > 0) {
      const randomAlly = closeAllies[Math.floor(Math.random() * closeAllies.length)];
      randomAlly.addPower(2);
    }
  }
}
