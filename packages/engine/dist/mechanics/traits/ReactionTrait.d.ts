import { Trait } from './Trait';
import type { UnitCard } from '../cards/Card';
import type { ReactionConfig } from '../core/react/ReactTypes';
export declare class ReactionTrait extends Trait {
    private config;
    private targetResolver;
    private valueResolver;
    private conditionEvaluator;
    private triggerManager;
    private effectRunner;
    constructor(owner: UnitCard, config: ReactionConfig);
    attach(engine: any): void;
    onDetach(): void;
    private handleTrigger;
}
