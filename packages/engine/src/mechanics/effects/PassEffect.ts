import { Effect } from './Effect';
import { TurnEndEffect } from './TurnEndEffect';
import type { EffectResult, GameState, PlayerId, GameEvent } from '../../core/types';

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
    const player = this.engine.getPlayer(this.playerId);
    
    // Player entity handles logic for determining if they are done
    await player.pass();

    // Queue the turn end effect
    this.engine.addInterrupt(new TurnEndEffect());

    return { newState: state, events };
  }

  getDescription(): string {
    return `PassEffect: Player ${this.playerId} passes`;
  }
}
