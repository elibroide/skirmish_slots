import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId } from '../../core/types';
/**
 * Effect that handles unit ability activation.
 * Wraps the ACTIVATE action for consistent effect stack ordering.
 */
export declare class ActivateEffect extends Effect {
    private playerId;
    private unitId;
    constructor(playerId: PlayerId, unitId: string);
    execute(state: GameState): Promise<EffectResult>;
    getDescription(): string;
}
