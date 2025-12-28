import type { GameAction, GameState, PlayerId } from '../core/types';
import type { AIPlayer } from './AIPlayer';
import type { SeededRNG } from '../core/SeededRNG';
/**
 * Simple random AI that:
 * - Declares done if it has no cards in hand
 * - Plays random cards
 * - Uses card.selectDefaultTarget() to find valid moves
 */
export declare class RandomAI implements AIPlayer {
    playerId: PlayerId;
    private rng?;
    constructor(playerId: PlayerId, rng?: SeededRNG);
    decideAction(state: GameState): GameAction | null;
}
