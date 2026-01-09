
import { Trait } from './traits/Trait';
import { ReactionTrait } from './traits/ReactionTrait';
import { PassiveTrait, type PassiveConfig } from './traits/PassiveTrait';
import type { ReactionConfig } from './react/ReactTypes';
import { RuleModifierTrait, type RuleConfig } from './traits/RuleModifierTrait';

import type { UnitCard } from '../cards/Card';

export type TraitDefinition =
  | { type: 'reaction'; config: ReactionConfig }
  | { type: 'passive'; config: PassiveConfig }
  | { type: 'ruleModifier'; config: RuleConfig }


export function createTrait(
  definition: TraitDefinition,
  owner: UnitCard,
  engine: any // GameEngine
): Trait {
  switch (definition.type) {
    case 'reaction':
      return new ReactionTrait(owner, definition.config);

    case 'passive':
      return new PassiveTrait(owner, definition.config);

    case 'ruleModifier':
      return new RuleModifierTrait(definition.config, owner);

    default:
      console.warn(`Unknown trait type: ${(definition as any).type}`);
      // Throw to be safe
      throw new Error(`Unknown trait type: ${(definition as any).type}`);
  }
}
