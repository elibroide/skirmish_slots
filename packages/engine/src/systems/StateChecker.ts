import type { GameState, PlayerId, PlayerSlotId } from '../core/types';
import type { Effect } from '../mechanics/effects/Effect';
import type { GameEngine } from '../core/GameEngine';
import { UnitCard } from '../mechanics/cards/Card';
import { ResolveDeathsEffect } from '../mechanics/effects/ResolveDeathsEffect';

/**
 * Checks game state for conditions that trigger automatic effects:
 * - Unit deaths (power <= 0)
 * - Skirmish end (both players declared done)
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
    const dyingUnits = this.checkDeaths(state);
    if (dyingUnits.length > 0) {
      // Return a single effect to handle all deaths
      dyingUnits.forEach(unit => {
        unit.die();
      });
    }

    return effects;
  }

  /**
   * Check if any units have power <= 0 and should die
   */
  private checkDeaths(state: GameState): UnitCard[] {
    const units: UnitCard[] = [];

    // Check all terrains for dead units using ENTITIES (so we can call die())
    for (const terrain of this.engine.terrains) {
      for (const playerId of [0, 1] as PlayerSlotId[]) {
        const unit = terrain.slots[playerId].unit;
        if (unit) {
           if (unit.power <= 0) {
             units.push(unit);
           }
        }
      }
    }

    return units;
  }

  /**
   * Check if the skirmish should end (both players declared done)
   */
  shouldEndSkirmish(state: GameState): boolean {
    return state.players[0].isDone && state.players[1].isDone;
  }

  /**
   * Check if the match should end and return the winner
   * @returns PlayerId if there's a winner, null for draw, undefined for ongoing
   */
  shouldEndMatch(state: GameState): PlayerId | null | undefined {
    // 2 skirmishes won = victory
    if (state.players[0].skirmishesWon >= 2) return 0;
    if (state.players[1].skirmishesWon >= 2) return 1;

    // 1 win + 1 tie = victory
    if (state.players[0].skirmishesWon === 1 && state.tieSkirmishes >= 1) return 0;
    if (state.players[1].skirmishesWon === 1 && state.tieSkirmishes >= 1) return 1;

    // 2 ties = draw
    if (state.tieSkirmishes >= 2) return null;

    // Continue playing
    return undefined;
  }
}
