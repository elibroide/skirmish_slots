import { Effect } from './Effect';
import { TurnEndEffect } from './TurnEndEffect';
import type { EffectResult, GameState, PlayerId, GameEvent } from '../types';

/**
 * Effect that handles a player passing.
 * Wraps the PASS action for consistent effect stack ordering.
 */
export class PassEffect extends Effect {
  constructor(private playerId: PlayerId) {
    super();
  }

  async execute(state: GameState): Promise<EffectResult> {
    const events: GameEvent[] = [];

    // Check if player becomes "done" (locked out for the skirmish)
    // This happens if they haven't taken any action this turn
    const opponent = (this.playerId + 1) % 2;
    const becomesDone = !state.hasActedThisTurn[this.playerId] || state.isDone[opponent];

    if (becomesDone) {
      // No action taken this turn - player is locked out for the skirmish
      state.isDone[this.playerId] = true;
    }

    events.push({
      type: 'PLAYER_PASSED',
      playerId: this.playerId,
      isDone: becomesDone,
    });

    // Queue the turn end effect
    this.engine.addInterrupt(new TurnEndEffect());

    return { newState: state, events };
  }

  getDescription(): string {
    return `PassEffect: Player ${this.playerId} passes`;
  }
}
