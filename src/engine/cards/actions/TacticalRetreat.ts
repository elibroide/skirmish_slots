import { ActionCard } from '../Card';
import type { PlayerId, GameState, TargetInfo } from '../../types';
import type { GameEngine } from '../../GameEngine';
import { BounceUnitEffect } from '../../effects';

/**
 * Tactical Retreat
 * Return an ally to your hand
 */
export class TacticalRetreat extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('tactical_retreat', 'Tactical Retreat', 'Return an ally to your hand', owner, engine);
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
      this.engine.enqueueEffect(new BounceUnitEffect(target));
    }
  }
}
