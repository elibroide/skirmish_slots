import { Effect } from './Effect';
import type { EffectResult, GameState, GameEvent } from '../../core/types';
import type { UnitCard } from '../cards/Card';

/**
 * Resolves unit deaths identified by the StateChecker.
 * Executes the death sequence for multiple units.
 */
export class ResolveDeathsEffect extends Effect {
  constructor(private dyingUnits: UnitCard[]) {
    super();
  }

  async execute(state: GameState): Promise<EffectResult> {
    const events: GameEvent[] = [];

    // Process deaths sequentially
    for (const unit of this.dyingUnits) {
      // Double check if unit is still on board and dead (state might have changed)
      if (unit.terrainId !== null && unit.power <= 0) {
        await unit.die('death');
      }
    }

    return { newState: state, events };
  }
}

