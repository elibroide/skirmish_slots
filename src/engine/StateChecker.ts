import type { GameState, PlayerId } from './types';
import type { Effect } from './effects/Effect';
import type { GameEngine } from './GameEngine';

/**
 * Checks game state for conditions that trigger automatic effects:
 * - Unit deaths (power <= 0)
 * - Round end (both players passed)
 * - Match end (win conditions met)
 */
export class StateChecker {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private engine: GameEngine) {}

  /**
   * Check all state-based conditions and return effects to enqueue.
   * This is called after each effect resolves.
   */
  checkStateConditions(state: GameState): Effect[] {
    const effects: Effect[] = [];

    // Check for unit deaths first
    effects.push(...this.checkDeaths(state));

    // NOTE: Round end and match end are handled by explicit actions (PASS)
    // and effects (ResolveRoundEffect), not automatic state checks.

    return effects;
  }

  /**
   * Check if any units have power <= 0 and should die
   */
  private checkDeaths(state: GameState): Effect[] {
    const deathEffects: Effect[] = [];

    // Import here to avoid circular dependency
    const { DeathEffect } = require('./effects/DeathEffect');

    for (const slot of state.slots) {
      for (let i = 0; i < 2; i++) {
        const unit = slot.units[i];
        if (unit && unit.power <= 0) {
          deathEffects.push(new DeathEffect(unit));
        }
      }
    }

    return deathEffects;
  }

  /**
   * Check if the round should end (both players passed)
   */
  shouldEndRound(state: GameState): boolean {
    return state.hasPassed[0] && state.hasPassed[1];
  }

  /**
   * Check if the match should end and return the winner
   * @returns PlayerId if there's a winner, null for draw, undefined for ongoing
   */
  shouldEndMatch(state: GameState): PlayerId | null | undefined {
    // 2 rounds won = victory
    if (state.players[0].roundsWon >= 2) return 0;
    if (state.players[1].roundsWon >= 2) return 1;

    // 1 win + 1 tie = victory
    if (state.players[0].roundsWon === 1 && state.tieRounds >= 1) return 0;
    if (state.players[1].roundsWon === 1 && state.tieRounds >= 1) return 1;

    // 2 ties = draw
    if (state.tieRounds >= 2) return null;

    // Continue playing
    return undefined;
  }
}
