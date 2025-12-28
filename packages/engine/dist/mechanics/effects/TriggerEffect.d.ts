import { Effect } from './Effect';
import type { EffectResult, GameState } from '../../core/types';
import type { Card } from '../cards/Card';
export declare class TriggerEffect extends Effect {
    private source;
    private name;
    private logic;
    constructor(source: Card, name: string, logic: (state: GameState) => Promise<void>);
    execute(state: GameState): Promise<EffectResult>;
}
