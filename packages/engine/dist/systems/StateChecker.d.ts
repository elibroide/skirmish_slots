import type { GameState, PlayerId } from '../core/types';
import type { Effect } from '../mechanics/effects/Effect';
import type { GameEngine } from '../core/GameEngine';
/**
 * Checks game state for conditions that trigger automatic effects:
 * - Unit deaths (power <= 0)
 * - Skirmish end (both players declared done)
 * - Match end (win conditions met)
 */
export declare class StateChecker {
    private engine;
    constructor(engine: GameEngine);
    /**
     * Check all state-based conditions and return effects to enqueue.
     * This is called after each effect resolves.
     */
    checkStateConditions(state: GameState): Effect[];
    /**
     * Check if any units have power <= 0 and should die
     */
    private checkDeaths;
    /**
     * Check if the skirmish should end (both players declared done)
     */
    shouldEndSkirmish(state: GameState): boolean;
    /**
     * Check if the match should end and return the winner
     * @returns PlayerId if there's a winner, null for draw, undefined for ongoing
     */
    shouldEndMatch(state: GameState): PlayerId | null | undefined;
}
