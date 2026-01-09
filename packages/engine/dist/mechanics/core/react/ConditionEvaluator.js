export class ConditionEvaluator {
    constructor(valueResolver, targetResolver) {
        Object.defineProperty(this, "valueResolver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: valueResolver
        });
        Object.defineProperty(this, "targetResolver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: targetResolver
        });
    }
    evaluate(condition, context, owner) {
        if (Array.isArray(condition)) {
            // If array, usually implies AND (all must be true)
            return condition.every(c => this.evaluateSingle(c, context, owner));
        }
        return this.evaluateSingle(condition, context, owner);
    }
    evaluateSingle(condition, context, owner) {
        // 1. Resolve Target(s) to test
        let targets = [];
        if (condition.target) {
            targets = this.targetResolver(condition.target, context);
        }
        else {
            // Default to Inherited context if omitted?
            // Spec says: "Defaults to Inherited context if omitted."
            // Inherited context usually means `context.unit` or `context.targets`
            if (context.inheritedTargets) {
                targets = context.inheritedTargets;
            }
            else if (context.unit) { // Fallback to unit in context (e.g. self or event source)
                targets = [context.unit];
            }
            else {
                // If really nothing, maybe owner?
                targets = [owner];
            }
        }
        if (targets.length === 0)
            return false; // No target to test = fail?
        // 2. Test Condition on ALL targets? or AT LEAST ONE?
        // "Filter specific targets" implies we test each one if this is used inside a filter.
        // If this is a Root Condition (Reaction.conditions), usually "All conditions must be true".
        // If the target selector found multiple units (e.g. "All Enemies"), does "Power < 5" mean "All Enemies have < 5 Power"?
        // Or does it mean "There exists an enemy with < 5 Power"?
        // Usually logic gates on sets implies "All" or "Any".
        // For now, let's assume ALL targets found must match if it's a condition check.
        // (If used as a filter in TargetResolver, we iterate one by one there).
        return targets.every(target => this.checkTarget(target, condition, context, owner));
    }
    checkTarget(target, condition, context, owner) {
        // Resolve Left Hand Value (Path)
        const leftVal = this.valueResolver['getProperty'](target, condition.path); // Accessing private helper? 
        // I should expose getProperty or resolve a "path" value selector.
        // Let's assume I can use a simpler getProperty here or make ValueResolver public.
        // I will duplicate getProperty for safety or update ValueResolver. 
        // Actually ValueSelector has { type: 'target', value: 'path' }. I can use resolution.
        // But here we have just a string path.
        // Let's just do property access.
        // Resolve Right Hand Value
        const rightVal = this.valueResolver.resolve(condition.value, context, owner);
        switch (condition.condition) {
            case 'eq': return leftVal == rightVal;
            case 'neq': return leftVal != rightVal;
            case 'gt': return Number(leftVal) > Number(rightVal);
            case 'lt': return Number(leftVal) < Number(rightVal);
            case 'contains':
                if (Array.isArray(leftVal))
                    return leftVal.includes(rightVal);
                if (typeof leftVal === 'string')
                    return leftVal.includes(rightVal);
                return false;
            default: return false;
        }
    }
}
