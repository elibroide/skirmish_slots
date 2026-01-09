import { Trait } from './Trait';
import type { ReactionConfig } from './react/ReactTypes';
import { type RuleConfig } from './traits/RuleModifierTrait';
import { type ShieldConfig } from './traits/ShieldTrait';
import { type DeployConditionConfig } from './traits/DeployConditionTrait';
import type { UnitCard } from '../cards/Card';
export type TraitDefinition = {
    type: 'reaction';
    config: ReactionConfig;
} | {
    type: 'ruleModifier';
    config: RuleConfig;
} | {
    type: 'shield';
    config: ShieldConfig;
} | {
    type: 'deployCondition';
    config: DeployConditionConfig;
};
/**
 * Factory function to create traits from configuration objects
 */
export declare function createTrait(definition: TraitDefinition, owner: UnitCard): Trait;
