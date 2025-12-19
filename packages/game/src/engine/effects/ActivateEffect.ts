import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId } from '../types';

/**
 * Effect that handles unit ability activation.
 * Wraps the ACTIVATE action for consistent effect stack ordering.
 */
export class ActivateEffect extends Effect {
  constructor(
    private playerId: PlayerId,
    private unitId: string
  ) {
    super();
  }

  async execute(state: GameState): Promise<EffectResult> {
    // Mark player as having acted this turn
    state.hasActedThisTurn[this.playerId] = true;

    // Find and activate the unit
    const unit = this.engine.getUnitById(this.unitId);
    if (unit) {
      await unit.activate();
    }

    // Events are emitted directly by unit.activate()
    return { newState: state, events: [] };
  }

  getDescription(): string {
    return `ActivateEffect: Player ${this.playerId} activates unit ${this.unitId}`;
  }
}
