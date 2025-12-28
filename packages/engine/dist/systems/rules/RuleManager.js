import { RuleType } from './RuleTypes';
export class RuleManager {
    constructor() {
        Object.defineProperty(this, "modifiers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        // Initialize maps for each rule type
        Object.values(RuleType).forEach((type) => {
            this.modifiers.set(type, []);
        });
    }
    /**
     * Register a rule modifier
     * @param id Unique identifier (usually card ID)
     * @param type Rule type
     * @param modifier Modifier function
     */
    registerRule(id, type, modifier) {
        const entries = this.modifiers.get(type) || [];
        entries.push({ id, modifier });
        this.modifiers.set(type, entries);
    }
    /**
     * Unregister rules by ID
     * @param id Identifier to remove
     * @param type Optional specific rule type to remove. If omitted, removes all rules for this ID.
     */
    unregisterRule(id, type) {
        if (type) {
            const entries = this.modifiers.get(type) || [];
            this.modifiers.set(type, entries.filter((entry) => entry.id !== id));
        }
        else {
            // Remove for all types
            this.modifiers.forEach((entries, ruleType) => {
                this.modifiers.set(ruleType, entries.filter((entry) => entry.id !== id));
            });
        }
    }
    /**
     * Evaluate a rule by running all modifiers
     * @param type Rule type
     * @param context Context for the rule
     * @param initialResult Initial result
     * @returns Final result after all modifiers
     */
    evaluate(type, context, initialResult) {
        const entries = this.modifiers.get(type) || [];
        let result = initialResult;
        for (const entry of entries) {
            result = entry.modifier(context, result);
        }
        return result;
    }
}
