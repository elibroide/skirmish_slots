import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId } from '../../core/types';
/**
 * Effect that handles a player passing.
 * Wraps the PASS action for consistent effect stack ordering.
 */
export declare class PassEffect extends Effect {
    private playerId;
    constructor(playerId: PlayerId);
    execute(state: GameState): Promise<EffectResult>;
    getDescription(): string;
}
