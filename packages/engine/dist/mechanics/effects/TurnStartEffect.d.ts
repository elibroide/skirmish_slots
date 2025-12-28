import { Effect } from './Effect';
import type { EffectResult, GameState } from '../../core/types';
export declare class TurnStartEffect extends Effect {
    execute(state: GameState): Promise<EffectResult>;
}
