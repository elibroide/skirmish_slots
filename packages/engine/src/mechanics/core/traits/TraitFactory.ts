import { Trait } from './traits/Trait';
import { ReactionTrait } from './traits/ReactionTrait';
import { PassiveTrait, type PassiveConfig } from './traits/PassiveTrait';
import type { ReactionConfig } from './react/ReactTypes';
import { RuleModifierTrait, type RuleConfig } from './traits/RuleModifierTrait';


import { DeployConditionTrait, type DeployConditionConfig } from './traits/DeployConditionTrait';

import type { UnitCard } from '../cards/Card';

export type TraitDefinition =
  | { type: 'reaction'; config: ReactionConfig }
  | { type: 'passive'; config: PassiveConfig }
  | { type: 'ruleModifier'; config: RuleConfig }


  | { type: 'deployCondition'; config: DeployConditionConfig }


/**
 * Factory function to create traits from configuration objects
 */
export function createTrait(definition: TraitDefinition, owner: UnitCard): Trait {
  switch (definition.type) {
    case 'reaction':
      return new ReactionTrait(owner, definition.config);

    case 'passive':
      return new PassiveTrait(owner, definition.config);

    case 'ruleModifier':
      return new RuleModifierTrait(definition.config, owner);





    case 'deployCondition':
      return new DeployConditionTrait(definition.config, owner);



    default:
      throw new Error(`Unknown trait type: ${JSON.stringify(definition)}`);
  }
}

