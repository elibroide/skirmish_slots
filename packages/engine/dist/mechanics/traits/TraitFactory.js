import { ReactionTrait } from './ReactionTrait';
import { OngoingReactionTrait } from './OngoingReactionTrait';
import { RuleModifierTrait } from './RuleModifierTrait';
import { ShieldTrait } from './ShieldTrait';
import { ActivateTrait } from './ActivateTrait';
import { SpecialTrait } from './SpecialTrait';
import { DeployConditionTrait } from './DeployConditionTrait';
import { DominantTrait } from './DominantTrait';
/**
 * Factory function to create traits from configuration objects
 */
export function createTrait(definition, owner) {
    switch (definition.type) {
        case 'reaction':
            return new ReactionTrait(definition.config, owner);
        case 'ongoingReaction':
            return new OngoingReactionTrait(definition.config, owner);
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
        case 'special':
            return new SpecialTrait(definition.hook, definition.implementation, definition.name || 'Special', owner);
        default:
            // TypeScript exhaustiveness check
            const _exhaustive = definition;
            throw new Error(`Unknown trait type: ${JSON.stringify(_exhaustive)}`);
    }
}
