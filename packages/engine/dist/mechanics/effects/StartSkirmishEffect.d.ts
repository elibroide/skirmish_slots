import { Effect } from './Effect';
import type { EffectResult, GameState } from '../../core/types';
/**
 * Start a new skirmish
 */
export declare class StartSkirmishEffect extends Effect {
    execute(state: GameState): Promise<EffectResult>;
}
