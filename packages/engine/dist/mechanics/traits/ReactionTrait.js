import { Trait } from './Trait';
import { TargetResolver } from '../core/react/TargetResolver';
import { ValueResolver } from '../core/react/ValueResolver';
import { ConditionEvaluator } from '../core/react/ConditionEvaluator';
import { TriggerManager } from '../core/react/TriggerManager';
import { EffectRunner } from '../core/react/EffectRunner';
export class ReactionTrait extends Trait {
    constructor(owner, config) {
        super('Reaction');
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: config
        });
        Object.defineProperty(this, "targetResolver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "valueResolver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "conditionEvaluator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "triggerManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "effectRunner", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.owner = owner;
    }
    attach(engine) {
        // 1. Initialize Resolvers
        // Dependency Injection Wiring
        this.conditionEvaluator = new ConditionEvaluator(null, // ValueResolver not created yet? Circular dependecy logic handled below.
        (selector, ctx) => this.targetResolver.resolve(selector, ctx, this.owner));
        this.targetResolver = new TargetResolver(engine, this.conditionEvaluator);
        this.valueResolver = new ValueResolver((selector, ctx) => this.targetResolver.resolve(selector, ctx, this.owner));
        // Fix circular dep for ValueResolver inside ConditionEvaluator
        // (Using simple property injection since ConditionEvaluator takes ValueResolver in constructor)
        // I need to instantiate ValueResolver first? 
        // ValueResolver needs TargetResolver.
        // TargetResolver needs ConditionEvaluator.
        // ConditionEvaluator needs ValueResolver.
        // Cycle: V -> T -> C -> V.
        // Break cycle: Pass 'null' first, then assign.
        // TypeScript allows this if mapped types, but property assignment is easier.
        // Or define interfaces.
        // Actually ConditionEvaluator only needs ValueResolver for 'evaluateSingle'.
        // I can create a proxy or lazy getter.
        // Let's rebuild properly.
        // Proxy pattern for ValueResolver inside ConditionEvaluator?
        const valueResolverProxy = {
            resolve: (s, c, o) => this.valueResolver.resolve(s, c, o),
            getProperty: (o, p) => this.valueResolver.getProperty(o, p)
        };
        this.conditionEvaluator = new ConditionEvaluator(valueResolverProxy, (selector, ctx) => this.targetResolver.resolve(selector, ctx, this.owner));
        this.targetResolver = new TargetResolver(engine, this.conditionEvaluator);
        this.valueResolver = new ValueResolver((selector, ctx) => this.targetResolver.resolve(selector, ctx, this.owner));
        // 2. Initialize Managers
        this.effectRunner = new EffectRunner(engine, this.targetResolver, this.valueResolver, this.conditionEvaluator);
        this.triggerManager = new TriggerManager(engine, this.owner, this.targetResolver, this.handleTrigger.bind(this));
        // 3. Register Triggers
        this.triggerManager.register(this.config.triggers);
    }
    onDetach() {
        if (this.triggerManager) {
            this.triggerManager.unregister();
        }
    }
    async handleTrigger(triggerConfig, event) {
        // 1. Create Context
        const context = {
            event,
            unit: this.owner, // "Me" context
            // Resolve initial targets if needed?
        };
        // 2. Check Root Conditions
        if (this.config.conditions) {
            const pass = this.conditionEvaluator.evaluate(this.config.conditions, context, this.owner);
            if (!pass)
                return;
        }
        // 3. Run Effects
        await this.effectRunner.run(this.config.effects, context, this.owner);
    }
}
