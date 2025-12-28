import { Trait } from './Trait';
import { type ReactionConfig } from './ReactionTrait';
import { type OngoingReactionConfig } from './OngoingReactionTrait';
import { type RuleModifierConfig } from './RuleModifierTrait';
import { type ShieldConfig } from './ShieldTrait';
import { type ActivateConfig } from './ActivateTrait';
import { type SpecialHook } from './SpecialTrait';
import { type DeployConditionConfig } from './DeployConditionTrait';
import { type DominantConfig } from './DominantTrait';
import type { UnitCard } from '../cards/Card';
import type { GameEngine } from '../../core/GameEngine';
export type TraitDefinition = {
    type: 'reaction';
    config: ReactionConfig;
} | {
    type: 'ongoingReaction';
    config: OngoingReactionConfig;
} | {
    type: 'ruleModifier';
    config: RuleModifierConfig;
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
} | {
    type: 'special';
    hook: SpecialHook;
    implementation: (owner: UnitCard, engine: GameEngine) => Promise<void> | void;
    name?: string;
};
/**
 * Factory function to create traits from configuration objects
 */
export declare function createTrait(definition: TraitDefinition, owner: UnitCard): Trait;
