import { Trait } from '../Trait';
import { TargetResolver } from '../react/TargetResolver';
import { ValueResolver } from '../react/ValueResolver';
import { ConditionEvaluator } from '../react/ConditionEvaluator';
import { TriggerManager } from '../react/TriggerManager';
import { EffectRunner } from '../react/EffectRunner';
/**
 * Validates limits for reaction execution.
 */
class ReactionLimiter {
    constructor(config, engine) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: config
        });
        Object.defineProperty(this, "engine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: engine
        });
        Object.defineProperty(this, "executionsThisTurn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "executionsThisRound", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "executionsTotal", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "lastTurnReset", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: -1
        });
        Object.defineProperty(this, "lastRoundReset", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: -1
        });
    }
    check() {
        if (!this.config)
            return true;
        this.syncLimitState();
        if (this.config.scope === 'Turn')
            return this.executionsThisTurn < this.config.max;
        if (this.config.scope === 'Round')
            return this.executionsThisRound < this.config.max;
        if (this.config.scope === 'Game')
            return this.executionsTotal < this.config.max;
        return true;
    }
    increment() {
        this.syncLimitState();
        this.executionsThisTurn++;
        this.executionsThisRound++;
        this.executionsTotal++;
    }
    syncLimitState() {
        // Reset counters if new turn/round
        const currentTurn = this.engine.state.currentTurn;
        if (currentTurn !== this.lastTurnReset) {
            this.executionsThisTurn = 0;
            this.lastTurnReset = currentTurn;
        }
        // Assuming round tracking is available or we approximate it.
        // For now, simpler implementation:
        // Round info might be in state?
        // const currentRound = this.engine.state.currentRound; 
        // if (currentRound !== this.lastRoundReset) {
        // this.executionsThisRound = 0;
        // this.lastRoundReset = currentRound;
        // }
    }
}
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
        Object.defineProperty(this, "limiter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.owner = owner;
    }
    attach(engine) {
        // 0. Initialize Limiter
        this.limiter = new ReactionLimiter(this.config.limit, engine);
        // 1. Initialize Resolvers
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
        // 4. Register Active Ability if needed
        const activateTrigger = this.config.triggers.find(t => t.type === 'Activate');
        if (activateTrigger) {
            // This card has an active ability!
            // We need to tell the UI about it.
            // In the future this should be more robust (reading label/cost from config)
            // For now, simple registration.
            this.owner.activateAbility = {
                description: "Available", // TODO: Add label to TriggerConfig
                cooldownMax: 1, // TODO: Derive from LimitConfig?
                cooldownRemaining: 0, // Managed by Limiter? UI expects this.
                activate: async () => {
                    // When UI clicks activate, we fire a synthetic event.
                    // Or directly call handleTrigger?
                    // TriggerManager is listening for ABILITY_TRIGGERED.
                    // So we just emit that event.
                    await engine.emitEvent({
                        type: 'ABILITY_TRIGGERED',
                        cardId: this.owner.id,
                        playerId: this.owner.owner,
                        cardName: this.owner.name,
                        abilityName: "Activate"
                    });
                }
            };
        }
    }
    onDetach() {
        if (this.triggerManager) {
            this.triggerManager.unregister();
        }
        this.owner.activateAbility = undefined;
    }
    async handleTrigger(triggerConfig, event) {
        // 1. Check Limits
        if (!this.limiter.check()) {
            console.log(`Reaction limit reached for ${this.owner.name}`);
            return;
        }
        // 2. Create Context
        const context = {
            event,
            unit: this.owner, // "Me" context
        };
        // 3. Check Root Conditions
        if (this.config.conditions) {
            const pass = this.conditionEvaluator.evaluate(this.config.conditions, context, this.owner);
            if (!pass)
                return;
        }
        // 4. Run Effects
        console.log(`Executing Reaction for ${this.owner.name} (Trigger: ${triggerConfig.type})`);
        await this.effectRunner.run(this.config.effects, context, this.owner);
        // 5. Increment Limit
        this.limiter.increment();
        // Update UI cooldown state if active
        if (this.owner.activateAbility && this.config.limit) {
            // Hacky mapping: If limit max matches executions, we are "on cooldown"
            // This assumes Scope=Turn.
            if (!this.limiter.check()) {
                this.owner.activateAbility.cooldownRemaining = 1;
            }
        }
    }
    onTurnStart() {
        // Used to reset cooldowns?
        // Limiter syncs on check() so strictly not needed, but for UI updates maybe?
        if (this.owner.activateAbility) {
            // Force check to see if limit reset
            if (this.limiter.check()) {
                this.owner.activateAbility.cooldownRemaining = 0;
            }
        }
    }
}
