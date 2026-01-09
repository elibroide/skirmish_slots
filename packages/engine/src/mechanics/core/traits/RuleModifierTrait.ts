
import { Trait } from './Trait';
import type { UnitCard } from '../../cards/Card';
import type { RuleType, RuleModifier } from '../../../systems/rules/RuleTypes';

export interface RuleConfig {
    ruleType: RuleType;
    modifier: RuleModifier<any>; // Using any for value type flexibility
}

export class RuleModifierTrait extends Trait {
    constructor(private config: RuleConfig, owner: UnitCard) {
        super('RuleModifier');
        this.owner = owner;
    }
    
    // In a real implementation, onAttach would register this rule with RuleManager.
    // For now, this is a data container unless we implement RuleManager.
}
