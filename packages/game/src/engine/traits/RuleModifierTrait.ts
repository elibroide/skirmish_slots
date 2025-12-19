import { Trait } from './Trait';
import type { UnitCard } from '../cards/Card';
import { RuleType, type RuleModifier } from '../rules/RuleTypes';

export interface RuleModifierConfig<T = any> {
  ruleType: RuleType;
  modifierFunction: RuleModifier<T>;
}

/**
 * RuleModifierTrait wraps the RuleManager system
 * Used for cards like Sentinel (block deployment) and Rogue (invert power comparison)
 */
export class RuleModifierTrait<T = any> extends Trait {
  constructor(
    private config: RuleModifierConfig<T>,
    owner?: UnitCard
  ) {
    super(`RuleModifier:${config.ruleType}`);
    if (owner) {
      this.owner = owner;
    }
  }

  async onDeploy(): Promise<void> {
    // Register the rule when deployed, binding the owner
    const boundModifier: RuleModifier<any> = (context, currentValue) => {
      return this.config.modifierFunction.call(this.owner, context, currentValue);
    };
    this.owner.registerRule(this.config.ruleType, boundModifier);
  }

  onDetach(): void {
    // Unregister the rule when detached
    this.owner.unregisterRule(this.config.ruleType);
  }
}

