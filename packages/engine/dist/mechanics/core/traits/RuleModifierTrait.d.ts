import { ContinuousTrait } from '../ContinuousTrait';
import type { UnitCard } from '../../cards/Card';
import type { RuleType, RuleModifier } from '../../../systems/rules/RuleTypes';
export interface RuleConfig {
    ruleType: RuleType;
    modifier: RuleModifier<any>;
}
/**
 * RuleModifierTrait wraps the RuleManager system
 * Used for cards like Sentinel (block deployment) and Rogue (invert power comparison)
 */
export declare class RuleModifierTrait extends ContinuousTrait {
    private config;
    constructor(config: RuleConfig, owner?: UnitCard);
    protected register(): void;
}
