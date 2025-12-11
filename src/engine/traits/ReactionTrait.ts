import { Trait } from './Trait';
import type { UnitCard } from '../cards/Card';
import type { SlotCoord } from '../rules/RuleTypes';
import { TriggerEffect } from '../effects/TriggerEffect';

export type TriggerType = 'ON_DEPLOY' | 'ON_DEATH' | 'ON_CONQUER' | 'ON_CONSUME' | 'ON_CONSUMED';
export type TargetType = 'SELF' | 'CLOSE_ALLY' | 'CLOSE_ENEMY' | 'CLOSE_ANY' | 'IN_FRONT' | 'ALL_ENEMIES' | 'SLOT' | 'CLOSE_ALLY_SLOT' | 'CONSUMING_UNIT' | 'CONSUMED_UNIT';
export type TargetDecision = 'PLAYER' | 'RANDOM' | 'ALL' | 'FIRST';
export type EffectType = 'DEAL_DAMAGE' | 'ADD_POWER' | 'SET_POWER' | 'DRAW_CARDS' | 'ADD_SLOT_MODIFIER' | 'KILL' | 'CLEANSE' | 'DEPLOY_UNIT';

export interface ReactionConfig {
  trigger: TriggerType;
  target?: TargetType;
  targetDecision?: TargetDecision;
  effect: EffectType;
  value: number | string | ((context: any) => number | string);
  condition?: (target: any) => boolean;
}

/**
 * ReactionTrait handles one-time lifecycle triggers
 * Examples: Deploy, Death, Conquer, Consume, Consumed
 */
export class ReactionTrait extends Trait {
  constructor(
    private config: ReactionConfig,
    owner?: UnitCard
  ) {
    super(`Reaction:${config.trigger}`);
    if (owner) {
      this.owner = owner;
    }
  }

  async onDeploy(): Promise<void> {
    if (this.config.trigger === 'ON_DEPLOY') {
      await this.executeReaction();
    }
  }

  async onDeath(): Promise<void> {
    if (this.config.trigger === 'ON_DEATH') {
      await this.executeReaction();
    }
  }

  async onConquer(): Promise<void> {
    if (this.config.trigger === 'ON_CONQUER') {
      await this.executeReaction();
    }
  }

  onConsume(victim: UnitCard): void {
    if (this.config.trigger === 'ON_CONSUME') {
      const logic = async () => {
        await this.executeReactionWithContext({ victim });
      };
      this.engine.addInterrupt(
        new TriggerEffect(this.owner, `${this.name}`, logic)
      );
    }
  }

  onConsumed(consumingUnit: UnitCard | null): void {
    if (this.config.trigger === 'ON_CONSUMED') {
      const logic = async () => {
        await this.executeReactionWithContext({ consumingUnit });
      };
      this.engine.addInterrupt(
        new TriggerEffect(this.owner, `${this.name}`, logic)
      );
    }
  }

  private async executeReaction(context?: any): Promise<void> {
    const logic = async () => {
      await this.executeReactionWithContext(context);
    };

    this.engine.addInterrupt(
      new TriggerEffect(this.owner, `${this.name}`, logic)
    );
  }

  private async executeReactionWithContext(context?: any): Promise<void> {
    // Get targets as SlotCoords
    const targetSlots = this.getTargets(context);

    if (targetSlots.length === 0 && this.config.target) {
      return; // No valid targets
    }

    // Apply condition filter if provided (get unit at slot and test condition)
    const filteredSlots = this.config.condition
      ? targetSlots.filter(slot => {
          const unit = this.engine.getUnitAt(slot);
          return unit && this.config.condition!(unit);
        })
      : targetSlots;

    if (filteredSlots.length === 0 && this.config.target) {
      return;
    }

    // Determine which targets to affect based on targetDecision
    let selectedSlots: SlotCoord[] = [];

    if (!this.config.target || this.config.target === 'SELF') {
      selectedSlots = filteredSlots;
    } else if (this.config.targetDecision === 'ALL') {
      selectedSlots = filteredSlots;
    } else if (this.config.targetDecision === 'PLAYER') {
      // Request player input
      if (filteredSlots.length === 0) return;

      const targetSlot = await this.owner.requestInput({
        type: 'target',
        targetType: this.getTargetTypeForInput(),
        validSlots: filteredSlots,
        context: `${this.owner.name}: ${this.name}`,
      });

      if (targetSlot) {
        selectedSlots = [targetSlot];
      }
    } else if (this.config.targetDecision === 'RANDOM') {
      const randomIndex = Math.floor(this.engine.rng.next() * filteredSlots.length);
      selectedSlots = [filteredSlots[randomIndex]];
    } else {
      selectedSlots = [filteredSlots[0]];
    }

    // Apply effect to selected targets
    for (const slot of selectedSlots) {
      await this.applyEffect(slot, context);
    }
  }

  private getTargets(context?: any): SlotCoord[] {
    if (!this.config.target || this.config.target === 'SELF') {
      // Return owner's slot
      if (this.owner.terrainId === null) return [];
      return [{
        terrainId: this.owner.terrainId,
        playerId: this.owner.owner
      }];
    }

    // Context-based targets (from consumption events)
    if (this.config.target === 'CONSUMING_UNIT') {
      const unit = context?.consumingUnit as UnitCard | undefined;
      if (!unit || unit.terrainId === null) return [];
      return [{
        terrainId: unit.terrainId,
        playerId: unit.owner
      }];
    }

    if (this.config.target === 'CONSUMED_UNIT') {
      const unit = context?.victim as UnitCard | undefined;
      if (!unit || unit.terrainId === null) return [];
      return [{
        terrainId: unit.terrainId,
        playerId: unit.owner
      }];
    }

    if (this.config.target === 'CLOSE_ALLY') {
      return this.unitsToSlotCoords(this.owner.getCloseAllies());
    }

    if (this.config.target === 'CLOSE_ENEMY') {
      return this.unitsToSlotCoords(this.owner.getCloseEnemies());
    }

    if (this.config.target === 'CLOSE_ANY') {
      return this.unitsToSlotCoords([...this.owner.getCloseAllies(), ...this.owner.getCloseEnemies()]);
    }

    if (this.config.target === 'IN_FRONT') {
      const unit = this.owner.getUnitInFront();
      if (!unit || unit.terrainId === null) return [];
      return [{
        terrainId: unit.terrainId,
        playerId: unit.owner
      }];
    }

    if (this.config.target === 'ALL_ENEMIES') {
      const slots: SlotCoord[] = [];
      const opponent = this.engine.getOpponent(this.owner.owner);
      for (let terrainId = 0; terrainId < 5; terrainId++) {
        const unit = this.engine.state.terrains[terrainId].slots[opponent].unit;
        if (unit) {
          slots.push({ terrainId: terrainId as any, playerId: opponent });
        }
      }
      return slots;
    }

    if (this.config.target === 'SLOT') {
      // Get close slots (for Priest cleanse - all nearby slots)
      const slots: SlotCoord[] = [];
      if (this.owner.terrainId !== null) {
        const myTerrainId = this.owner.terrainId;
        const opponent = this.engine.getOpponent(this.owner.owner);
        
        // Slot in front
        slots.push({ terrainId: myTerrainId, playerId: opponent });
        
        // Adjacent terrain slots
        if (myTerrainId > 0) {
          slots.push({ terrainId: (myTerrainId - 1) as any, playerId: this.owner.owner });
          slots.push({ terrainId: (myTerrainId - 1) as any, playerId: opponent });
        }
        if (myTerrainId < 4) {
          slots.push({ terrainId: (myTerrainId + 1) as any, playerId: this.owner.owner });
          slots.push({ terrainId: (myTerrainId + 1) as any, playerId: opponent });
        }
      }
      return slots;
    }

    if (this.config.target === 'CLOSE_ALLY_SLOT') {
      // Get close ally slots (for Knight - adjacent terrain slots on same side)
      const slots: SlotCoord[] = [];
      if (this.owner.terrainId !== null) {
        const myTerrainId = this.owner.terrainId;
        
        // Only adjacent terrain slots on owner's side, and must be valid for deployment
        if (myTerrainId > 0) {
          const leftSlot = { terrainId: (myTerrainId - 1) as any, playerId: this.owner.owner };
          // Check if deployment would be allowed (will be validated by DeployConditionTrait if needed)
          slots.push(leftSlot);
        }
        if (myTerrainId < 4) {
          const rightSlot = { terrainId: (myTerrainId + 1) as any, playerId: this.owner.owner };
          slots.push(rightSlot);
        }
      }
      return slots;
    }

    return [];
  }

  private unitsToSlotCoords(units: UnitCard[]): SlotCoord[] {
    return units
      .filter(u => u.terrainId !== null)
      .map(u => ({
        terrainId: u.terrainId!,
        playerId: u.owner
      }));
  }

  private getTargetTypeForInput(): string {
    if (this.config.target === 'CLOSE_ENEMY' || this.config.target === 'ALL_ENEMIES') {
      return 'enemy_unit';
    }
    if (this.config.target === 'CLOSE_ALLY') {
      return 'ally_unit';
    }
    return 'unit';
  }

  private async applyEffect(slot: SlotCoord, context?: any): Promise<void> {
    const value = typeof this.config.value === 'function'
      ? this.config.value(context || { unit: this.owner })
      : this.config.value;

    // Get the unit at the slot (if there is one)
    const targetUnit = this.engine.getUnitAt(slot);

    switch (this.config.effect) {
      case 'DEAL_DAMAGE':
        if (targetUnit) {
          await targetUnit.dealDamage(value as number);
        }
        break;

      case 'ADD_POWER':
        if (targetUnit) {
          await targetUnit.addPower(value as number);
        }
        break;

      case 'SET_POWER':
        if (targetUnit) {
          // Set power by calculating the difference from current power
          const targetPower = value as number;
          const currentPower = targetUnit.power;
          const diff = targetPower - currentPower;
          if (diff !== 0) {
            await targetUnit.addPower(diff);
          }
        }
        break;

      case 'DRAW_CARDS':
        const player = this.engine.getPlayer(this.owner.owner);
        await player.draw(value as number);
        break;

      case 'ADD_SLOT_MODIFIER':
        const slotState = this.engine.state.terrains[slot.terrainId].slots[slot.playerId];
        slotState.modifier += value as number;

        await this.engine.emitEvent({
          type: 'SLOT_MODIFIER_CHANGED',
          terrainId: slot.terrainId,
          playerId: slot.playerId,
          newModifier: slotState.modifier
        });
        break;

      case 'KILL':
        if (targetUnit) {
          await targetUnit.die(`killed by ${this.owner.name}'s ${this.name}`);
        }
        break;

      case 'CLEANSE':
        // Cleanse a slot: remove slot modifier and unit buffs
        const slotToCleanse = this.engine.state.terrains[slot.terrainId].slots[slot.playerId];
        
        // Clear slot modifier
        if (slotToCleanse.modifier !== 0) {
          slotToCleanse.modifier = 0;
          await this.engine.emitEvent({
            type: 'SLOT_MODIFIER_CHANGED',
            terrainId: slot.terrainId,
            playerId: slot.playerId,
            newModifier: 0
          });
        }

        // Clear unit buffs
        if (targetUnit) {
          const oldPower = targetUnit.power;
          targetUnit.buffs = 0;
          const newPower = targetUnit.power;
          
          if (newPower !== oldPower) {
            await this.engine.emitEvent({
              type: 'UNIT_POWER_CHANGED',
              unitId: targetUnit.id,
              terrainId: slot.terrainId,
              oldPower,
              newPower,
              amount: newPower - oldPower
            });
            
            targetUnit.onPowerChanged(oldPower, newPower);
          }
        }
        break;

      case 'DEPLOY_UNIT':
        // Deploy a new unit (token) to a slot
        const { createUnitCard } = await import('../cards/CardFactory');
        const tokenId = typeof this.config.value === 'string' ? this.config.value : String(value);
        const token = createUnitCard(tokenId as any, this.owner.owner, this.engine);
        await token.deploy(slot.terrainId);
        break;
    }
  }
}

