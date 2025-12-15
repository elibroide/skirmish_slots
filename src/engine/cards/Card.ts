import type { PlayerId, TerrainId, TargetInfo, GameState, UnitCard as IUnitCard, GameEvent } from '../types';
import type { GameEngine } from '../GameEngine';
import { GameEntity } from '../GameEntity';
import { RuleType, type RuleModifier, type SlotCoord } from '../rules/RuleTypes';
import type { Trait } from '../traits/Trait';

/**
 * Base class for all cards
 * Extends GameEntity for common functionality (requestInput, engine access)
 */
export abstract class Card extends GameEntity {
  id: string; // Unique instance ID
  cardId: string; // Card type ID (e.g., "scout")
  name: string;
  description: string; // Card ability description
  private eventUnsubscribers: (() => void)[] = [];

  constructor(cardId: string, name: string, description: string, owner: PlayerId, engine: GameEngine) {
    super(engine, owner);
    // Use engine's seeded RNG for deterministic card IDs
    // Generate a random number between 0 and 999999
    const randomNum = Math.floor(engine.rng.next() * 1000000);
    this.id = `p${owner}_${cardId}_${randomNum}`;
    this.cardId = cardId;
    this.name = name;
    this.description = description;
  }

  /**
   * Get the type of this card
   */
  abstract getType(): 'unit' | 'action';

  /**
   * Does this card need a target to be played?
   */
  needsTarget(): boolean {
    return false;
  }

  /**
   * Get valid targets for this card
   */
  getValidTargets(state: GameState): TargetInfo {
    // If unit, use engine validation
    if (this.getType() === 'unit') {
      const validSlots: SlotCoord[] = [];
      const terrains = state.terrains;

      terrains.forEach((_, index) => {
        const terrainId = index as TerrainId;
        // Units typically target their own slot
        if (this.engine.isDeploymentAllowed(this, terrainId)) {
          validSlots.push({ terrainId, playerId: this.owner });
        }
      });

      return {
        type: 'slots',
        validSlots,
      };
    }
    
    return { type: 'none' };
  }

  /**
   * Select a default target (for AI)
   */
  selectDefaultTarget(state: GameState): SlotCoord | null {
    const targets = this.getValidTargets(state);

    if (targets.type === 'slots' && targets.validSlots.length > 0) {
      return targets.validSlots[0];
    }

    return null;
  }

  // ========== Rule System Helpers ==========

  /**
   * Register a rule modifier
   * @param type Rule type
   * @param modifier Modifier function
   */
  registerRule<T = boolean>(type: RuleType, modifier: RuleModifier<T>): void {
    this.engine.ruleManager.registerRule(this.id, type, modifier);
  }

  /**
   * Unregister rules for this card
   * @param type Optional specific rule type to remove
   */
  unregisterRule(type?: RuleType): void {
    this.engine.ruleManager.unregisterRule(this.id, type);
  }

  // ========== Event System Helpers ==========

  /**
   * Subscribe to a game event. Automatically unsubscribes on leave.
   * @param callback Event listener
   */
  subscribe(callback: (event: GameEvent) => void): void {
    const unsubscribe = this.engine.onEvent(callback);
    this.eventUnsubscribers.push(unsubscribe);
  }

  /**
   * Unsubscribe from all registered events
   */
  unsubscribeAll(): void {
    this.eventUnsubscribers.forEach(unsub => unsub());
    this.eventUnsubscribers = [];
  }

  // ========== Lifecycle Hooks ==========

  /**
   * Override onLeave for base Card cleanup
   */
  onLeave(): void {
    // Default behavior: Unregister all rules and unsubscribe from events
    this.unregisterRule();
    this.unsubscribeAll();
  }
}

/**
 * Base class for unit cards
 * Now concrete - uses trait system for behavior composition
 */
export class UnitCard extends Card implements IUnitCard {
  // power: number; // Removed - using getter
  originalPower: number;
  damage: number = 0;
  buffs: number = 0;
  terrainId: TerrainId | null = null;

  // Traits (ECS Components)
  traits: Trait[] = [];

  // Override onLeave to notify traits
  onLeave(): void {
    // Notify traits that we're leaving the battlefield
    for (const trait of this.traits) {
      trait.onLeave();
    }
    // DON'T call onDetach() or clear the traits array - traits remain attached
    
    // Call parent cleanup
    super.onLeave();
  }

  // Activate/Cooldown system
  activateAbility?: {
    cooldownMax: number;
    cooldownRemaining: number;
    description: string;
    activate: () => void;
  };

  constructor(cardId: string, name: string, description: string, power: number, owner: PlayerId, engine: GameEngine) {
    super(cardId, name, description, owner, engine);
    // this.power = power; // Removed
    this.originalPower = power;
  }

  getType(): 'unit' {
    return 'unit';
  }

  /**
   * Get the current effective power of the unit
   */
  get power(): number {
    let p = this.originalPower + this.buffs - this.damage;

    // Apply slot modifiers if on board
    if (this.terrainId !== null) {
      const slotModifier = this.engine.getSlotModifier(this.terrainId, this.owner);
      p += slotModifier;
    }

    // Apply trait modifiers
    for (const trait of this.traits) {
      p = trait.modifyPower(p);
    }

    return Math.max(0, p);
  }

  // ========== Core Actions (Direct Async Methods) ==========

  /**
   * Deploy this unit to a terrain.
   * Handles consumption of existing units automatically.
   */
  async deploy(terrainId: TerrainId): Promise<void> {
    const terrain = this.engine.state.terrains[terrainId];
    const existingUnit = terrain.slots[this.owner].unit;
    let victim: UnitCard | null = null;

    // 1. Handle Consumption
    if (existingUnit) {
      victim = existingUnit as unknown as UnitCard;
      await this.consume(victim);
    }

    // 2. Place Unit
    terrain.slots[this.owner].unit = this;
    this.terrainId = terrainId;

    await this.engine.emitEvent({
      type: 'UNIT_DEPLOYED',
      unitId: this.id,
      unitName: this.name,
      terrainId,
      playerId: this.owner,
    });

    // 3. Trigger Lifecycle
    await this.onDeploy();

    // 4. Queue Trigger Resolution (This stays as an Effect/Interrupt because it's a reaction chain)
    if (victim) {
      const { ResolveConsumptionEffect } = await import('../effects/ResolveConsumptionEffect');
      this.engine.addInterrupt(new ResolveConsumptionEffect(victim, this));
    }
  }

  /**
   * Consume another unit (wrapper around death + event).
   */
  async consume(victim: UnitCard): Promise<void> {
    // Victim dies (cause: 'consumed')
    await victim.die('consumed');

    await this.engine.emitEvent({
      type: 'UNIT_CONSUMED',
      unitId: victim.id,
      unitName: victim.name,
      terrainId: victim.terrainId!, 
    });
  }

  /**
   * Die (remove from board -> graveyard).
   */
  async die(cause: string = 'death'): Promise<void> {
    const terrainId = this.terrainId;
    if (terrainId === null) return;

    // 1. Remove from board
    const terrain = this.engine.state.terrains[terrainId];
    terrain.slots[this.owner].unit = null;
    
    // 2. Add to graveyard
    const player = this.engine.state.players[this.owner];
    player.graveyard.push(this);

    await this.engine.emitEvent({
      type: 'UNIT_DIED',
      unitId: this.id,
      unitName: this.name,
      terrainId,
      cause,
    });

    // 3. Trigger Death Rattle
    await this.onDeath();

    // 4. Cleanup and clear terrain reference
    this.terrainId = null;
    this.onLeave();
  }

  /**
   * Bounce back to hand.
   */
  async bounce(): Promise<void> {
    const terrainId = this.terrainId;
    if (terrainId === null) return;

    // 1. Remove from board
    const terrain = this.engine.state.terrains[terrainId];
    terrain.slots[this.owner].unit = null;
    this.terrainId = null;

    // 2. Add to hand
    const player = this.engine.state.players[this.owner];
    player.hand.push(this);

    // 3. Reset State
    this.buffs = 0;
    this.damage = 0;

    await this.engine.emitEvent({
      type: 'UNIT_BOUNCED',
      unitId: this.id,
      unitName: this.name,
      terrainId,
      toHand: true,
    });

    this.onLeave();
  }

  // ========== Lifecycle Hooks ==========
  // These are called automatically by effects
  // Now async to support requestInput() calls

  /**
   * Called when this unit is deployed to a terrain
   */
  async onDeploy(): Promise<void> {
    // Call trait hooks
    for (const trait of this.traits) {
      await trait.onDeploy();
    }
    // Override in subclasses for additional behavior
  }

  /**
   * Called when this unit dies (any reason)
   */
  async onDeath(): Promise<void> {
    // Call trait hooks
    for (const trait of this.traits) {
      await trait.onDeath();
    }
    // Override in subclasses for additional behavior
  }

  /**
   * Called when this unit conquers its terrain
   */
  async onConquer(): Promise<void> {
    // Call trait hooks
    for (const trait of this.traits) {
      await trait.onConquer();
    }
    // Override in subclasses for additional behavior
  }

  /**
   * Called when this unit's power changes
   */
  onPowerChanged(_oldPower: number, _newPower: number): void {
    // Override in subclasses
  }

  /**
   * Called at start of owner's turn (for cooldown reduction and turn-start triggers)
   */
  onTurnStart(): void {
    // Call trait hooks
    for (const trait of this.traits) {
      trait.onTurnStart();
    }
    // Override in subclasses for additional behavior
  }

  /**
   * Called when this unit is consumed (by another unit or action)
   */
  onConsumed?(consumingUnit: UnitCard | null): void {
    // Call trait hooks
    for (const trait of this.traits) {
      trait.onConsumed?.(consumingUnit);
    }
  }

  /**
   * Called when this unit consumes another unit
   */
  onConsume?(victim: UnitCard): void {
    // Call trait hooks
    for (const trait of this.traits) {
      trait.onConsume?.(victim);
    }
  }

  // ========== Activate/Cooldown Methods ==========

  /**
   * Check if this unit can activate its ability
   */
  canActivate(): boolean {
    if (!this.activateAbility) return false;
    return this.activateAbility.cooldownRemaining === 0;
  }

  /**
   * Activate this unit's ability
   */
  async activate(): Promise<void> {
    if (!this.canActivate()) return;
    this.activateAbility!.activate();
    this.activateAbility!.cooldownRemaining = this.activateAbility!.cooldownMax;

    await this.engine.emitEvent({
      type: 'ABILITY_ACTIVATED',
      unitId: this.id,
      abilityName: this.activateAbility!.description,
    });
  }

  /**
   * Reduce cooldown by 1 (called at start of owner's turn)
   */
  async reduceCooldown(): Promise<void> {
    if (!this.activateAbility) return;
    if (this.activateAbility.cooldownRemaining > 0) {
      this.activateAbility.cooldownRemaining--;

      await this.engine.emitEvent({
        type: 'COOLDOWN_REDUCED',
        unitId: this.id,
        newCooldown: this.activateAbility.cooldownRemaining,
      });
    }
  }

  // ========== Trait Management ==========

  /**
   * Add a trait to this unit
   */
  addTrait(trait: Trait): void {
    trait.onAttach(this);
    this.traits.push(trait);
  }

  /**
   * Remove a trait from this unit
   */
  removeTrait(traitId: string): void {
    const index = this.traits.findIndex(t => t.id === traitId);
    if (index !== -1) {
      const trait = this.traits[index];
      trait.onDetach();
      this.traits.splice(index, 1);
    }
  }

  // ========== Helper Methods ==========

  /**
   * Add power to this unit (buff)
   */
  async addPower(amount: number): Promise<void> {
    const oldPower = this.power;
    this.buffs += amount;

    await this.engine.emitEvent({
      type: 'UNIT_POWER_CHANGED',
      unitId: this.id,
      terrainId: this.terrainId!,
      oldPower,
      newPower: this.power,
      amount,
      // Removed duplicate keys
    });

    this.onPowerChanged(oldPower, this.power);
  }

  /**
   * Deal damage to this unit (reduce power)
   */
  async dealDamage(amount: number): Promise<void> {
    const oldPower = this.power;
    
    // Apply trait interceptors (e.g., Shield)
    let actualDamage = amount;
    for (const trait of this.traits) {
      actualDamage = trait.interceptDamage(actualDamage);
    }
    
    this.damage += actualDamage;
    // Cap damage logic is handled in getter (max(0, p))

    await this.engine.emitEvent({
      type: 'UNIT_DAMAGED',
      unitId: this.id,
      terrainId: this.terrainId!,
      amount: actualDamage,
      newPower: this.power,
      // Removed duplicate keys
    });

    this.onPowerChanged(oldPower, this.power);
  }

  /**
   * Heal this unit (restore power up to original)
   * Note: Keep for future use, not used by V2 cards
   */
  async heal(amount: number): Promise<void> {
    const oldPower = this.power;
    // Healing reduces accumulated damage
    const damageToHeal = Math.min(this.damage, amount);
    this.damage -= damageToHeal;
    
    if (damageToHeal > 0) {
      await this.engine.emitEvent({
        type: 'UNIT_HEALED',
        unitId: this.id,
        terrainId: this.terrainId!,
        amount: damageToHeal,
        newPower: this.power,
        // Removed duplicate keys
      });

      this.onPowerChanged(oldPower, this.power);
    }
  }

  /**
   * Get close ally units (adjacent terrains)
   */
  getCloseAllies(): UnitCard[] {
    return this.engine.getCloseUnits(this.terrainId, this.owner, 'ally');
  }

  /**
   * Get close enemy units (adjacent terrains)
   */
  getCloseEnemies(): UnitCard[] {
    return this.engine.getCloseUnits(this.terrainId, this.owner, 'enemy');
  }

  /**
   * Get unit in front (opposite player's unit on same terrain)
   */
  getUnitInFront(): UnitCard | null {
    if (this.terrainId === null) return null;
    return this.engine.getUnitInFront(this.terrainId, this.owner);
  }

  /**
   * Check if this unit can be consumed
   * NOTE: This check doesn't include context (who is consuming), so it's a basic check.
   * Full validation happens in GameEngine using RuleManager.
   */
  canBeConsumed(): boolean {
    return true;
  }
}

/**
 * Base class for action cards
 */
export abstract class ActionCard extends Card {
  getType(): 'action' {
    return 'action';
  }

  /**
   * Play this action card
   * Target parameter is now SlotCoord (if target was selected)
   */
  abstract play(target?: SlotCoord): Promise<void>;
}
