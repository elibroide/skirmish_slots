import { ActionCard } from '../Card';
import type { PlayerId, GameState, TargetInfo } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Inspiration
 * An ally gets +4
 */
export class Inspiration extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('inspiration', 'Inspiration', 'An ally gets +4', owner, engine);
  }

  needsTarget(): boolean {
    return true;
  }

  getValidTargets(state: GameState): TargetInfo {
    // Can target any ally unit on the board
    const allyUnits = this.engine.getPlayerUnits(this.owner);
    return {
      type: 'ally_unit',
      validUnitIds: allyUnits.map(u => u.id),
    };
  }

  play(targetUnitId?: unknown): void {
    if (typeof targetUnitId !== 'string') return;

    const target = this.engine.getUnitById(targetUnitId);
    if (target && target.owner === this.owner) {
      target.addPower(4);
    }
  }
}
