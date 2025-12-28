import { Effect } from './Effect';
import type { EffectResult, GameState } from '../../core/types';
/**
 * Resolve the skirmish (calculate terrain winners, award SP, trigger Conquer effects)
 */
export declare class ResolveSkirmishEffect extends Effect {
    execute(state: GameState): Promise<EffectResult>;
    private checkMatchEnd;
    private cleanupSkirmish;
    private cleanupMatchEnd;
}
