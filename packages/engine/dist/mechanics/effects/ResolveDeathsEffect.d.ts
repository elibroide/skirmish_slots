import { Effect } from './Effect';
import type { EffectResult, GameState } from '../../core/types';
import type { UnitCard } from '../cards/Card';
/**
 * Resolves unit deaths identified by the StateChecker.
 * Executes the death sequence for multiple units.
 */
export declare class ResolveDeathsEffect extends Effect {
    private dyingUnits;
    constructor(dyingUnits: UnitCard[]);
    execute(state: GameState): Promise<EffectResult>;
}
