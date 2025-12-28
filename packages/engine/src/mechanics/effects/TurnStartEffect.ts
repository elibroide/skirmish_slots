import { Effect } from './Effect';
import type { EffectResult, GameState, GameEvent } from '../../core/types';

export class TurnStartEffect extends Effect {
  async execute(state: GameState): Promise<EffectResult> {
    const events: GameEvent[] = [];
    const currentPlayer = state.currentPlayer;

    // Trigger onTurnStart for all units owned by the current player
    for (const terrain of this.engine.terrains) {
      const unit = terrain.slots[currentPlayer].unit;
      if (unit) {
        // Trigger turn start ability (e.g. Bard, Engineer)
        unit.onTurnStart();
        
        // Reduce cooldowns (if any)
        await unit.reduceCooldown();
      }
    }

    events.push({
      type: 'TURN_CHANGED' as const,
      playerId: currentPlayer,
    });

    return { newState: state, events };
  }
}

