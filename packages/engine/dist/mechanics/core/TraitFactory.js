import { ReactionTrait } from './traits/ReactionTrait';
import { RuleModifierTrait } from './traits/RuleModifierTrait';
import { ShieldTrait } from './traits/ShieldTrait';
import { DeployConditionTrait } from './traits/DeployConditionTrait';
/**
 * Factory function to create traits from configuration objects
 */
export function createTrait(definition, owner) {
    switch (definition.type) {
        case 'reaction':
            return new ReactionTrait(owner, definition.config);
        case 'ruleModifier':
            return new RuleModifierTrait(definition.config, owner);
        case 'shield':
            return new ShieldTrait(definition.config, owner);
        case 'deployCondition':
            return new DeployConditionTrait(definition.config, owner);
        default:
            throw new Error(`Unknown trait type: ${JSON.stringify(definition)}`);
    }
}
