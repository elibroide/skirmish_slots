import type { UnitCard } from '../../cards/Card';
import type { TargetSelector as Selector } from './ReactTypes';
import { ConditionEvaluator } from './ConditionEvaluator';
export declare class TargetResolver {
    private engine;
    private conditionEvaluator;
    constructor(engine: any, conditionEvaluator: ConditionEvaluator);
    resolve(selector: Selector, context: any, owner: UnitCard): any[];
    private resolveRelative;
}
