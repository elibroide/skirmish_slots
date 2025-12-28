import { Effect } from './Effect';
import { getLeader } from '../leaders';
import type { EffectResult, GameState, PlayerId, GameEvent } from '../../core/types';

/**
 * Effect that handles leader ability activation.
 * Wraps the ACTIVATE_LEADER action for consistent effect stack ordering.
 */
export class ActivateLeaderEffect extends Effect {
  constructor(private playerId: PlayerId) {
    super();
  }

  async execute(state: GameState): Promise<EffectResult> {
    const events: GameEvent[] = [];
    // Delegate to Player entity
    await this.engine.getPlayer(this.playerId).activateLeader();

    return { newState: state, events };
  }

  getDescription(): string {
    return `ActivateLeaderEffect: Player ${this.playerId} activates leader ability`;
  }
}
