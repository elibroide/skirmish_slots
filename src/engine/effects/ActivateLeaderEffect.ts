import { Effect } from './Effect';
import { getLeader } from '../leaders';
import type { EffectResult, GameState, PlayerId, GameEvent } from '../types';

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
    const leaderState = state.leaders[this.playerId];

    // Mark player as having acted this turn
    state.hasActedThisTurn[this.playerId] = true;

    // Consume charge
    const oldCharges = leaderState.currentCharges;
    leaderState.currentCharges--;

    events.push({
      type: 'LEADER_CHARGES_CHANGED',
      playerId: this.playerId,
      oldCharges,
      newCharges: leaderState.currentCharges,
    });

    // Execute the leader's ability
    const leader = getLeader(leaderState.leaderId, this.engine, this.playerId);
    if (leader.ability) {
      await leader.ability.execute();
    }

    events.push({
      type: 'LEADER_ABILITY_ACTIVATED',
      playerId: this.playerId,
      leaderId: leaderState.leaderId,
      abilityName: leader.definition.name,
      chargesRemaining: leaderState.currentCharges,
    });

    return { newState: state, events };
  }

  getDescription(): string {
    return `ActivateLeaderEffect: Player ${this.playerId} activates leader ability`;
  }
}
