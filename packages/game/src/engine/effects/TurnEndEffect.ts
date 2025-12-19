import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId, GameEvent } from '../types';
import { TurnStartEffect } from './TurnStartEffect';
import { ResolveSkirmishEffect } from './ResolveSkirmishEffect';

export class TurnEndEffect extends Effect {
  async execute(state: GameState): Promise<EffectResult> {
    const events: GameEvent[] = [];
    const currentPlayer = state.currentPlayer;
    const opponent = (1 - currentPlayer) as PlayerId;

    // Increment turn counter each time a player passes
    state.currentTurn++;

    if (state.isDone.every(done => done)) {
      this.engine.addInterrupt(new ResolveSkirmishEffect());
    }

    if (!state.isDone[opponent]) {
      state.currentPlayer = opponent;
      state.hasActedThisTurn[opponent] = false; // Reset for their new turn
      state.hasPlayedCardThisTurn[opponent] = false; // Reset card play for new turn

      events.push({
        type: 'PRIORITY_CHANGED',
        newPriority: opponent,
      });

      // Start the turn for the new player
      this.engine.addInterrupt(new TurnStartEffect());
    }

    return { newState: state, events };
  }
}

