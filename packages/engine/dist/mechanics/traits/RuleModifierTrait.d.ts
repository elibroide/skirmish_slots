import { Trait } from './Trait';
import type { UnitCard } from '../cards/Card';
import { RuleType, type RuleModifier } from '../../systems/rules/RuleTypes';
export interface RuleModifierConfig<T = any> {
    ruleType: RuleType;
    modifierFunction: RuleModifier<T>;
}
/**
 * RuleModifierTrait wraps the RuleManager system
 * Used for cards like Sentinel (block deployment) and Rogue (invert power comparison)
 */
export declare class RuleModifierTrait<T = any> extends Trait {
    private config;
    constructor(config: RuleModifierConfig<T>, owner?: UnitCard);
    onDeploy(): Promise<void>;
    onDetach(): void;
}
