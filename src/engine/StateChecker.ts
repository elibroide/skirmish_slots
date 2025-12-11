import type { GameState, PlayerId, PlayerSlotId } from './types';
import type { Effect } from './effects/Effect';
import type { GameEngine } from './GameEngine';
import { UnitCard } from './cards/Card';
import { ResolveDeathsEffect } from './effects/ResolveDeathsEffect';

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

    // Check all terrains for dead units
    for (const terrain of state.terrains) {
      for (const playerId of [0, 1] as PlayerSlotId[]) {
        const unit = terrain.slots[playerId].unit;
        // Cast to UnitCard to access power property
        if (unit) {
           const unitCard = unit as unknown as UnitCard;
           if (unitCard.power <= 0) {
             units.push(unitCard);
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
    return state.isDone[0] && state.isDone[1];
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
