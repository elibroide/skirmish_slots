import { Trait } from './Trait';
/**
 * RuleModifierTrait wraps the RuleManager system
 * Used for cards like Sentinel (block deployment) and Rogue (invert power comparison)
 */
export class RuleModifierTrait extends Trait {
    constructor(config, owner) {
        super(`RuleModifier:${config.ruleType}`);
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: config
        });
        if (owner) {
            this.owner = owner;
        }
    }
    async onDeploy() {
        // Register the rule when deployed, binding the owner
        const boundModifier = (context, currentValue) => {
            return this.config.modifierFunction.call(this.owner, context, currentValue);
        };
        this.owner.registerRule(this.config.ruleType, boundModifier);
    }
    onDetach() {
        // Unregister the rule when detached
        this.owner.unregisterRule(this.config.ruleType);
    }
}
