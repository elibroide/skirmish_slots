import { RuleType, type RuleModifier, type RuleContext } from './RuleTypes';
export declare class RuleManager {
    private modifiers;
    constructor();
    /**
     * Register a rule modifier
     * @param id Unique identifier (usually card ID)
     * @param type Rule type
     * @param modifier Modifier function
     */
    registerRule<T = boolean>(id: string, type: RuleType, modifier: RuleModifier<T>): void;
    /**
     * Unregister rules by ID
     * @param id Identifier to remove
     * @param type Optional specific rule type to remove. If omitted, removes all rules for this ID.
     */
    unregisterRule(id: string, type?: RuleType): void;
    /**
     * Evaluate a rule by running all modifiers
     * @param type Rule type
     * @param context Context for the rule
     * @param initialResult Initial result
     * @returns Final result after all modifiers
     */
    evaluate<T = boolean>(type: RuleType, context: RuleContext, initialResult: T): T;
}
