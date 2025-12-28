import { Trait } from './Trait';
import type { UnitCard } from '../cards/Card';
import type { GameEvent } from '../../core/types';
import { TriggerEffect } from '../effects/TriggerEffect';

export type OngoingTrigger = 
  | 'UNIT_DIED' 
  | 'UNIT_DAMAGED' 
  | 'UNIT_DEPLOYED' 
  | 'UNIT_POWER_CHANGED'
  | 'UNIT_HEALED'
  | 'UNIT_CONSUMED'
  | 'UNIT_BOUNCED'
  | 'CARD_PLAYED' 
  | 'CARD_DRAWN'
  | 'TURN_CHANGED'
  | 'YOUR_TURN_START'      // Triggers when owner's turn starts
  | 'YOUR_TURN_ENDS'
  | 'OPPONENT_TURN_START'  // Triggers when opponent's turn starts
  | 'ROUND_STARTED'
  | 'SKIRMISH_STARTED'
  | 'SKIRMISH_ENDED'
  | 'TERRAIN_RESOLVED'
  | 'ABILITY_ACTIVATED';

export type ProximityType = 'CLOSE' | 'IN_FRONT' | 'SAME_TERRAIN';
export type OngoingTargetType = 'SELF' | 'CLOSE_ALLY' | 'CLOSE_ENEMY' | 'EVENT_SOURCE';
export type OngoingEffectType = 'ADD_POWER' | 'DEAL_DAMAGE' | 'ADD_SLOT_MODIFIER' | 'BOUNCE' | 'MOVE' | 'HEAL' | 'CREATE_CARDS';

export interface OngoingEffectConfig {
  target?: OngoingTargetType;
  targetDecision?: 'ALL' | 'SELF' | 'RANDOM';
  effect: OngoingEffectType;
  value: number | string | ((event: GameEvent) => number | string);
}

export interface OngoingReactionConfig {
  listenTo: OngoingTrigger;
  proximity?: ProximityType;
  filter?: (event: GameEvent, owner: UnitCard) => boolean;
  // Support both single effect (legacy) and multiple effects
  target?: OngoingTargetType;
  targetDecision?: 'ALL' | 'SELF' | 'RANDOM';
  effect?: OngoingEffectType;
  value?: number | string | ((event: GameEvent) => number | string);
  effects?: OngoingEffectConfig[];
}

/**
 * OngoingReactionTrait handles continuous event-based triggers
 * Examples: "When a unit dies", "When damage is dealt", "When turn starts"
 */
export class OngoingReactionTrait extends Trait {
  private unsubscribe?: () => void;

  constructor(
    private config: OngoingReactionConfig,
    owner?: UnitCard
  ) {
    super(`Ongoing:${config.listenTo}`);
    if (owner) {
      this.owner = owner;
    }
  }

  onAttach(card: UnitCard): void {
    super.onAttach(card);
    
    // If card is already on battlefield, subscribe immediately
    if (card.terrainId !== null) {
      this.unsubscribe = this.engine.onEvent((event) => {
        this.handleEvent(event);
      });
    }
  }

  async onDeploy(): Promise<void> {
    // Subscribe when entering battlefield (if not already subscribed)
    if (!this.unsubscribe) {
      this.unsubscribe = this.engine.onEvent((event) => {
        this.handleEvent(event);
      });
    }
  }

  onLeave(): void {
    // Unsubscribe when leaving battlefield
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  onDetach(): void {
    // Final cleanup - ensure we're unsubscribed
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  private handleEvent(event: GameEvent): void {
    // Check if this is the event we're listening for
    // Handle special triggers that derive from base events
    if (this.config.listenTo === 'YOUR_TURN_ENDS') {
      if (event.type !== 'PRIORITY_CHANGED' || event.newPriority === this.owner.owner) {
        return;
      }
    } else if (this.config.listenTo === 'YOUR_TURN_START') {
      if (event.type !== 'TURN_CHANGED' || event.playerId !== this.owner.owner) {
        return;
      }
    } else if (this.config.listenTo === 'OPPONENT_TURN_START') {
      if (event.type !== 'TURN_CHANGED' || event.playerId === this.owner.owner) {
        return;
      }
    } else if (event.type !== this.config.listenTo) {
      return;
    }

    // Apply proximity filter if configured
    if (this.config.proximity && !this.checkProximity(event)) {
      return;
    }

    // Apply custom filter if provided
    if (this.config.filter && !this.config.filter(event, this.owner)) {
      return;
    }

    // Execute the reaction
    this.executeReaction(event);
  }

  private checkProximity(event: GameEvent): boolean {
    if (!this.config.proximity) return true;

    const myTerrainId = this.owner.terrainId;
    if (myTerrainId === null) return false;

    let eventTerrainId: number | undefined;

    if ('terrainId' in event) {
      eventTerrainId = event.terrainId;
    }

    if (eventTerrainId === undefined) return false;

    if (this.config.proximity === 'CLOSE') {
      // Close = adjacent terrains OR same terrain
      return Math.abs(myTerrainId - eventTerrainId) <= 1;
    }

    if (this.config.proximity === 'IN_FRONT') {
      // Same terrain only
      return myTerrainId === eventTerrainId;
    }

    if (this.config.proximity === 'SAME_TERRAIN') {
      return myTerrainId === eventTerrainId;
    }

    return false;
  }

  private executeReaction(event: GameEvent): void {
    const logic = async () => {
      await this.applyReaction(event);
    };

    this.engine.addInterrupt(
      new TriggerEffect(this.owner, `${this.name}`, logic)
    );
  }

  private async applyReaction(event: GameEvent): Promise<void> {
    // Support both single effect (legacy) and multiple effects
    const effectConfigs: OngoingEffectConfig[] = this.config.effects || [{
      target: this.config.target,
      targetDecision: this.config.targetDecision,
      effect: this.config.effect!,
      value: this.config.value!
    }];

    // Process each effect
    for (const effectConfig of effectConfigs) {
      await this.applyEffectConfig(effectConfig, event);
    }
  }

  private async applyEffectConfig(effectConfig: OngoingEffectConfig, event: GameEvent): Promise<void> {
    // Determine target(s)
    let targets: UnitCard[] = [];

    if (!effectConfig.target || effectConfig.target === 'SELF') {
      targets = [this.owner];
    } else if (effectConfig.target === 'CLOSE_ALLY') {
      targets = this.owner.getCloseAllies();
    } else if (effectConfig.target === 'CLOSE_ENEMY') {
      targets = this.owner.getCloseEnemies();
    } else if (effectConfig.target === 'EVENT_SOURCE') {
      // Target the unit that triggered the event
      if ('unitId' in event) {
        const sourceUnit = this.engine.getUnitById(event.unitId);
        if (sourceUnit) {
          targets = [sourceUnit as UnitCard];
        }
      }
    }

    // Apply to all targets if targetDecision is ALL
    if (effectConfig.targetDecision === 'ALL' || !effectConfig.targetDecision) {
      for (const target of targets) {
        await this.applyEffect(target, event, effectConfig);
      }
    } else if (effectConfig.targetDecision === 'SELF') {
      await this.applyEffect(this.owner, event, effectConfig);
    } else if (effectConfig.targetDecision === 'RANDOM') {
      await this.applyEffect(targets[this.engine.rng.next() * targets.length], event, effectConfig);
    }
  }

  private async applyEffect(target: UnitCard, event: GameEvent, effectConfig: OngoingEffectConfig): Promise<void> {
    const value = typeof effectConfig.value === 'function'
      ? effectConfig.value(event)
      : effectConfig.value;

    switch (effectConfig.effect) {
      case 'ADD_POWER':
        await target.addPower(value as number);
        break;

      case 'DEAL_DAMAGE':
        await target.dealDamage(value as number);
        break;

      case 'ADD_SLOT_MODIFIER':
        if (target.terrainId !== null) {
          const slot = this.engine.terrains[target.terrainId].slots[target.owner];
          slot.setModifier(slot.modifier + (value as number));
        }
        break;

      case 'BOUNCE':
        // Bounce the target back to hand
        if (target.terrainId !== null) {
          await target.bounce();
        }
        break;

      case 'MOVE':
        // Move the target to a random empty ally slot
        if (target.terrainId !== null) {
          const currentTerrainId = target.terrainId;
          const emptySlots = [];

          // Find all empty ally slots (excluding current position)
          for (let terrainId = 0; terrainId < 5; terrainId++) {
            if (terrainId !== currentTerrainId) {
              const slot = this.engine.terrains[terrainId].slots[target.owner];
              if (!slot.unit) {
                emptySlots.push(terrainId);
              }
            }
          }

          // If there are empty slots, move to a random one
          if (emptySlots.length > 0) {
            const randomIndex = Math.floor(this.engine.rng.next() * emptySlots.length);
            const newTerrainId = emptySlots[randomIndex];

            // target.move handles slot updates and event emission
            await target.move(newTerrainId as any);
          }
        }
        break;

      case 'HEAL':
        // Heal the target unit
        await target.heal(value as number);
        break;

      case 'CREATE_CARDS':
        // Create cards and add them to owner's hand
        // value should be a string like "spike:2" meaning create 2 spike cards
        const valueStr = String(value);
        const [cardId, countStr] = valueStr.includes(':') ? valueStr.split(':') : [valueStr, '1'];
        const count = parseInt(countStr, 10) || 1;

        const { createCard } = await import('../cards');
        const player = this.engine.getPlayer(this.owner.owner);

        for (let i = 0; i < count; i++) {
          const card = createCard(cardId, this.owner.owner, this.engine);
          await player.addToHand(card);

          await this.engine.emitEvent({
            type: 'CARD_DRAWN',
            playerId: this.owner.owner,
            count: 1,
            card: card,
          });
        }
        break;
    }
  }
}

