import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId } from '../../core/types';
/**
 * Effect that handles leader ability activation.
 * Wraps the ACTIVATE_LEADER action for consistent effect stack ordering.
 */
export declare class ActivateLeaderEffect extends Effect {
    private playerId;
    constructor(playerId: PlayerId);
    execute(state: GameState): Promise<EffectResult>;
    getDescription(): string;
}
