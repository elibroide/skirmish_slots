
import { Trait } from './Trait';
import type { UnitCard } from '../../cards/Card';
import type { Condition } from '../react/ReactTypes';
import { TargetResolver } from '../react/TargetResolver';
import { ValueResolver } from '../react/ValueResolver';
import { ConditionEvaluator } from '../react/ConditionEvaluator';
import { Modifier, ModifierConfig } from '../modifiers/Modifier';
import { BuffPowerModifier } from '../modifiers/BuffPowerModifier';

// Registry of modifiers
const MODIFIERS: Record<string, any> = {
    'BuffPower': BuffPowerModifier
};

export interface PassiveConfig {
    conditions?: Condition[];
    modifiers: ModifierConfig[];
}

export class PassiveTrait extends Trait {
    private targetResolver!: TargetResolver;
    private valueResolver!: ValueResolver;
    private conditionEvaluator!: ConditionEvaluator;
    
    // Track active state to avoid re-applying unnecessarily
    private isActive: boolean = false;
    
    private activeModifiers: Modifier[] = [];

    constructor(
        owner: UnitCard,
        private config: PassiveConfig
    ) {
        super('Passive');
        this.owner = owner;
    }

    public attach(engine: any): void {
        const valueResolverProxy = {
            resolve: (s: any, c: any, o: any) => this.valueResolver.resolve(s, c, o),
            getProperty: (o: any, p: string) => this.valueResolver.getProperty(o, p)
        } as ValueResolver;

        this.conditionEvaluator = new ConditionEvaluator(
            valueResolverProxy,
            (selector, ctx) => this.targetResolver.resolve(selector, ctx, this.owner)
        );
        this.targetResolver = new TargetResolver(engine, this.conditionEvaluator);
        this.valueResolver = new ValueResolver(
            (selector, ctx) => this.targetResolver.resolve(selector, ctx, this.owner)
        );
        
        // Setup modifiers
        this.activeModifiers = this.config.modifiers.map(modConfig => {
            const ClassRef = MODIFIERS[modConfig.type];
            if (!ClassRef) {
                console.warn(`PassiveTrait: Unknown modifier type ${modConfig.type}`);
                return null;
            }
            return new ClassRef(modConfig);
        }).filter(m => m !== null) as Modifier[];

        // Initial check
        this.checkAndApply();
    }

    // Lifecycle hooks to trigger re-evaluation
    // "Always On" means checking whenever state might change relevant to conditions.
    // Ideally we'd know WHICH events, but checking on common hooks is a safe start.
    
    public onTurnStart(): void {
        this.checkAndApply();
    }

    public async onDeploy(): Promise<void> {
        this.checkAndApply();
    }
    
    // TODO: Add more hooks or a generic subscription if conditions are complex (like "When ally dies")
    
    public onDetach(): void {
        this.deactivate();
    }
    
    public onLeave(): void {
        this.deactivate();
    }

    private checkAndApply() {
        // Create context
        const context = {
            unit: this.owner,
            engine: this.engine
        };

        // Check conditions
        let shouldBeActive = true;
        if (this.config.conditions && this.config.conditions.length > 0) {
            shouldBeActive = this.conditionEvaluator.evaluate(this.config.conditions, context, this.owner);
        }

        if (shouldBeActive && !this.isActive) {
            this.activate(context);
        } else if (!shouldBeActive && this.isActive) {
            this.deactivate(context);
        }
    }

    private activate(context?: any) {
        if (this.isActive) return;
        
        console.log(`PassiveTrait: Activating modifiers for ${this.owner.name}`);
        const ctx = context || { unit: this.owner, engine: this.engine };
        
        for (const mod of this.activeModifiers) {
            // Resolve targets for this modifier
            // NOTE: Modifier config has 'target' selector.
            const targets = this.targetResolver.resolve(
                (mod as any).config.target, // Access config from modifier instance
                ctx,
                this.owner
            );

            // Apply to each target
            targets.forEach(target => {
                mod.apply(target as any, { source: this.owner, engine: this.engine });
            });
        }
        
        this.isActive = true;
    }

    private deactivate(context?: any) {
        if (!this.isActive) return;

        console.log(`PassiveTrait: Deactivating modifiers for ${this.owner.name}`);
        const ctx = context || { unit: this.owner, engine: this.engine };

        for (const mod of this.activeModifiers) {
            // We need to resolve targets again to remove? 
            // Or ideally, the modifier tracked who it touched?
            // For simple "Aura" where targets might have moved, re-resolving is usually correct 
            // IF the modifier is an Aura. 
            // But if targets Moved out of range, they should lose the buff.
            // This suggests "Re-Apply" logic is needed for Auras, not just on/off.
            // For MVP (Self-Buffs or Static Targets), re-resolving is fine.
            
            const targets = this.targetResolver.resolve(
                (mod as any).config.target,
                ctx,
                this.owner
            );

            targets.forEach(target => {
                mod.remove(target as any, { source: this.owner, engine: this.engine });
            });
        }
        
        this.isActive = false;
    }
}
