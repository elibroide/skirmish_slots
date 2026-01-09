import type { UnitCard } from '../../cards/Card';
import type { EffectConfig } from './ReactTypes';
import { TargetResolver } from './TargetResolver';
import { ValueResolver } from './ValueResolver';
import { ConditionEvaluator } from './ConditionEvaluator';
export declare class EffectRunner {
    private engine;
    private targetResolver;
    private valueResolver;
    private conditionEvaluator;
    constructor(engine: any, targetResolver: TargetResolver, valueResolver: ValueResolver, conditionEvaluator: ConditionEvaluator);
    run(configs: EffectConfig[], context: any, owner: UnitCard): Promise<void>;
    private executeSingle;
}
