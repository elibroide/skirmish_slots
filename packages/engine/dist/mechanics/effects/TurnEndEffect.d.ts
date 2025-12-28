import { Effect } from './Effect';
import type { EffectResult, GameState } from '../../core/types';
export declare class TurnEndEffect extends Effect {
    execute(state: GameState): Promise<EffectResult>;
}
