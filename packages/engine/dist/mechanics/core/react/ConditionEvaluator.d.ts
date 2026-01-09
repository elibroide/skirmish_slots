import type { UnitCard } from '../../cards/Card';
import type { Condition, TargetSelector } from './ReactTypes';
import { ValueResolver } from './ValueResolver';
export type TargetResolverFn = (selector: TargetSelector, context: any) => any[];
export declare class ConditionEvaluator {
    private valueResolver;
    private targetResolver;
    constructor(valueResolver: ValueResolver, targetResolver: TargetResolverFn);
    evaluate(condition: Condition | Condition[], context: any, owner: UnitCard): boolean;
    private evaluateSingle;
    private checkTarget;
}
