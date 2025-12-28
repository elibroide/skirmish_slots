import type { GameAction, GameState, PlayerId } from '../core/types';
/**
 * Interface for AI decision-making logic.
 * Pure function: GameState → GameAction
 */
export interface AIPlayer {
    playerId: PlayerId;
    /**
     * Decide what action to take given the current game state.
     * Returns null if no valid action (shouldn't happen in practice).
     */
    decideAction(state: GameState): GameAction | null;
}
