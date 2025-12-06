import { ActionCard } from '../Card';
import type { PlayerId, GameState, TargetInfo } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Precision Strike
 * Kill a unit with 3 or less power
 */
export class PrecisionStrike extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('precision_strike', 'Precision Strike', 'Kill a unit with 3 or less power', owner, engine);
  }

  needsTarget(): boolean {
    return true;
  }

  getValidTargets(state: GameState): TargetInfo {
    // Can target any unit with 3 or less power
    const validUnits: string[] = [];
    for (const terrain of state.terrains) {
      if (terrain.slots[0].unit && terrain.slots[0].unit.power <= 3) {
        validUnits.push(terrain.slots[0].unit.id);
      }
      if (terrain.slots[1].unit && terrain.slots[1].unit.power <= 3) {
        validUnits.push(terrain.slots[1].unit.id);
      }
    }
    return {
      type: 'unit',
      validUnitIds: validUnits,
    };
  }

  play(targetUnitId?: unknown): void {
    if (typeof targetUnitId !== 'string') return;

    const target = this.engine.getUnitById(targetUnitId);
    if (target && target.power <= 3) {
      target.power = 0; // Kill it
    }
  }
}
