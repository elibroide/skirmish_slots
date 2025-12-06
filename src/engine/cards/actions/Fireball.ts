import { ActionCard } from '../Card';
import type { PlayerId, GameState, TargetInfo } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Fireball
 * Deal 6 damage to a unit
 */
export class Fireball extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('fireball', 'Fireball', 'Deal 6 damage to a unit', owner, engine);
  }

  needsTarget(): boolean {
    return true;
  }

  getValidTargets(state: GameState): TargetInfo {
    // Can target any unit on the board
    const allUnits: string[] = [];
    for (const terrain of state.terrains) {
      if (terrain.slots[0].unit) allUnits.push(terrain.slots[0].unit.id);
      if (terrain.slots[1].unit) allUnits.push(terrain.slots[1].unit.id);
    }
    return {
      type: 'unit',
      validUnitIds: allUnits,
    };
  }

  play(targetUnitId?: unknown): void {
    if (typeof targetUnitId !== 'string') return;

    const target = this.engine.getUnitById(targetUnitId);
    if (target) {
      target.dealDamage(6);
    }
  }
}
