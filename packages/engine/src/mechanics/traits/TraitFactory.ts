import { Trait } from './Trait';
import { ReactionTrait, type ReactionConfig } from './ReactionTrait';
import { OngoingReactionTrait, type OngoingReactionConfig } from './OngoingReactionTrait';
import { RuleModifierTrait, type RuleModifierConfig } from './RuleModifierTrait';
import { ShieldTrait, type ShieldConfig } from './ShieldTrait';
import { ActivateTrait, type ActivateConfig } from './ActivateTrait';
import { SpecialTrait, type SpecialHook } from './SpecialTrait';
import { DeployConditionTrait, type DeployConditionConfig } from './DeployConditionTrait';
import { DominantTrait, type DominantConfig } from './DominantTrait';
import type { UnitCard } from '../cards/Card';
import type { GameEngine } from '../../core/GameEngine';

export type TraitDefinition =
  | { type: 'reaction'; config: ReactionConfig }
  | { type: 'ongoingReaction'; config: OngoingReactionConfig }
  | { type: 'ruleModifier'; config: RuleModifierConfig }
  | { type: 'shield'; config: ShieldConfig }
  | { type: 'activate'; config: ActivateConfig }
  | { type: 'deployCondition'; config: DeployConditionConfig }
  | { type: 'dominant'; config: DominantConfig }
  | { type: 'special'; hook: SpecialHook; implementation: (owner: UnitCard, engine: GameEngine) => Promise<void> | void; name?: string };

/**
 * Factory function to create traits from configuration objects
 */
export function createTrait(definition: TraitDefinition, owner: UnitCard): Trait {
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
      return new SpecialTrait(
        definition.hook,
        definition.implementation,
        definition.name || 'Special',
        owner
      );

    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = definition;
      throw new Error(`Unknown trait type: ${JSON.stringify(_exhaustive)}`);
  }
}

