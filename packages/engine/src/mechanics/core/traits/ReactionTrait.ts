import { Trait } from './Trait';
import type { UnitCard } from '../../cards/Card';
import type { ReactionConfig, TriggerConfig, LimitConfig } from '../react/ReactTypes';
import { TargetResolver } from '../react/TargetResolver';
import { ValueResolver } from '../react/ValueResolver';
import { ConditionEvaluator } from '../react/ConditionEvaluator';
import { TriggerManager } from '../react/TriggerManager';
import { EffectRunner } from '../react/EffectRunner';
import { SelectionResolver } from '../react/SelectionResolver';
import { TriggerEffect } from '../../effects/TriggerEffect';

/**
 * Validates limits for reaction execution.
 */
class ReactionLimiter {
    private executionsThisTurn = 0;
    private executionsThisRound = 0;
    private executionsTotal = 0;
    private lastTurnReset = -1;
    private lastRoundReset = -1;

    constructor(
        private config: LimitConfig | undefined,
        private engine: any
    ) {}

    public check(): boolean {
        if (!this.config) return true;

        this.syncLimitState();

        if (this.config.scope === 'Turn') return this.executionsThisTurn < this.config.max;
        if (this.config.scope === 'Round') return this.executionsThisRound < this.config.max;
        if (this.config.scope === 'Game') return this.executionsTotal < this.config.max;
        
        return true;
    }

    public increment(): void {
        this.syncLimitState();
        this.executionsThisTurn++;
        this.executionsThisRound++;
        this.executionsTotal++;
    }

    private syncLimitState() {
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
  private targetResolver!: TargetResolver;
  private valueResolver!: ValueResolver;
  private conditionEvaluator!: ConditionEvaluator;
  private triggerManager!: TriggerManager;
  private effectRunner!: EffectRunner;
  private selectionResolver!: SelectionResolver;
  private limiter!: ReactionLimiter;

  constructor(
      owner: UnitCard, 
      private config: ReactionConfig
  ) {
    super('Reaction');
    this.owner = owner;
  }

  public onAttach(card: UnitCard): void {
      super.onAttach(card);
      const engine = card.engine;

      // 0. Initialize Limiter
      this.limiter = new ReactionLimiter(this.config.limit, engine);

      // 1. Initialize Resolvers
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
      this.selectionResolver = new SelectionResolver();

      // 2. Initialize Managers
      this.effectRunner = new EffectRunner(
          engine, 
          this.targetResolver, 
          this.valueResolver, 
          this.conditionEvaluator,
          this.selectionResolver
      );

      this.triggerManager = new TriggerManager(
          engine,
          this.owner,
          this.targetResolver,
          this.handleTrigger.bind(this)
      );

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

  public onDetach(): void {
      if (this.triggerManager) {
          this.triggerManager.unregister();
      }
      this.owner.activateAbility = undefined;
  }

  private async handleTrigger(triggerConfig: TriggerConfig, event: any): Promise<void> {
      console.log('ReactionTrait.handleTrigger called for', triggerConfig.type);
      // 1. Check Limits (Fast Fail)
      if (!this.limiter.check()) {
          console.log(`Reaction limit reached for ${this.owner.name}`);
          return;
      }
      console.log('Reaction limit pass');

      this.engine.addInterrupt(new TriggerEffect(
          this.owner,
          `Reaction: ${triggerConfig.type}`, // Description
          async (state: any) => { // Async Logic
              
              // double-check limit inside stack execution? 
              // Usually limits are checked at trigger time to preventing queueing.
              
              // 3. Create Context
              const context = {
                  event,
                  unit: this.owner,
                  state 
              };

              // 4. Check Root Conditions
              if (this.config.conditions) {
                  const pass = this.conditionEvaluator.evaluate(this.config.conditions, context, this.owner);
                  if (!pass) return;
              }

              // 5. Delegate to EffectRunner (Handles Candidates, Selection, Action)
              await this.effectRunner.run(this.config.effects, context, this.owner);

              // 6. Increment Limit check
              this.limiter.increment();
              
              // Update UI
              if (this.owner.activateAbility && this.config.limit) {
                   if (!this.limiter.check()) {
                       this.owner.activateAbility.cooldownRemaining = 1; 
                   }
              }
          }
      ));
  }
  
  public onTurnStart() {
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
