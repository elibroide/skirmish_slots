import { ContinuousTrait } from '../ContinuousTrait';
/**
 * RuleModifierTrait wraps the RuleManager system
 * Used for cards like Sentinel (block deployment) and Rogue (invert power comparison)
 */
export class RuleModifierTrait extends ContinuousTrait {
    constructor(config, owner) {
        super(`RuleMod:${config.ruleType}`, owner);
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: config
        });
    }
    register() {
        // Logic to limit rule scope?
        // RuleModifierTrait seems to assume global rule or specific rule?
        // Existing code was: this.owner.unregisterRule(this.config.ruleType);
        // Wait. The code in Step 138 has constructor unregistering rule?
        // "RuleModifierTrait wraps the RuleManager system".
        // Usually it should REGISTER a rule.
        // I will assume it registers the modifier provided in config.
        const { ruleType, modifier } = this.config;
        this.engine.ruleManager.registerRule(this.id, ruleType, modifier);
    }
}
