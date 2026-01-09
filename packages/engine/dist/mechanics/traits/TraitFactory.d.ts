import { Trait } from './Trait';
import type { ReactionConfig } from '../core/react/ReactTypes';
import { type RuleConfig } from './RuleModifierTrait';
import { type ShieldConfig } from './ShieldTrait';
import { type ActivateConfig } from './ActivateTrait';
import { type DeployConditionConfig } from './DeployConditionTrait';
import { type DominantConfig } from './DominantTrait';
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
    type: 'activate';
    config: ActivateConfig;
} | {
    type: 'deployCondition';
    config: DeployConditionConfig;
} | {
    type: 'dominant';
    config: DominantConfig;
};
/**
 * Factory function to create traits from configuration objects
 */
export declare function createTrait(definition: TraitDefinition, owner: UnitCard): Trait;
