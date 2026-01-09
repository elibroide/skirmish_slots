import { ReactionTrait } from './ReactionTrait';
import { RuleModifierTrait } from './RuleModifierTrait';
import { ShieldTrait } from './ShieldTrait';
import { ActivateTrait } from './ActivateTrait';
import { DeployConditionTrait } from './DeployConditionTrait';
import { DominantTrait } from './DominantTrait';
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
        case 'activate':
            return new ActivateTrait(definition.config, owner);
        case 'deployCondition':
            return new DeployConditionTrait(definition.config, owner);
        case 'dominant':
            return new DominantTrait(definition.config, owner);
        default:
            throw new Error(`Unknown trait type: ${JSON.stringify(definition)}`);
    }
}
