import type { PlayerId, TerrainId, TargetInfo, GameState, UnitCard as IUnitCard, InputRequest } from '../types';
import type { GameEngine } from '../GameEngine';
import { generateId } from '../../utils/helpers';

/**
 * Base class for all cards
 */
export abstract class Card {
  id: string; // Unique instance ID
  cardId: string; // Card type ID (e.g., "scout")
  name: string;
  description: string; // Card ability description
  owner: PlayerId;
  engine: GameEngine;

  constructor(cardId: string, name: string, description: string, owner: PlayerId, engine: GameEngine) {
    this.id = generateId();
    this.cardId = cardId;
    this.name = name;
    this.description = description;
    this.owner = owner;
    this.engine = engine;
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
  getValidTargets(_state: GameState): TargetInfo {
    return { type: 'none' };
  }

  /**
   * Select a default target (for AI)
   */
  selectDefaultTarget(state: GameState): string | TerrainId | null {
    const targets = this.getValidTargets(state);

    if (targets.type === 'enemy_unit' || targets.type === 'ally_unit' || targets.type === 'unit') {
      return targets.validUnitIds[0] || null;
    }

    if (targets.type === 'terrain') {
      return targets.validTerrainIds[0] ?? null;
    }

    return null;
  }
}

/**
 * Base class for unit cards
 */
export abstract class UnitCard extends Card implements IUnitCard {
  power: number;
  originalPower: number;
  terrainId: TerrainId | null = null;  // Changed from slotId

  // Activate/Cooldown system
  activateAbility?: {
    cooldownMax: number;
    cooldownRemaining: number;
    description: string;
    activate: () => void;
  };

  constructor(cardId: string, name: string, description: string, power: number, owner: PlayerId, engine: GameEngine) {
    super(cardId, name, description, owner, engine);
    this.power = power;
    this.originalPower = power;
  }

  getType(): 'unit' {
    return 'unit';
  }

  // ========== Input Request Helper ==========

  /**
   * Request player input (targeting, modal choices, etc.)
   * This method suspends effect execution until player provides input
   *
   * Example:
   *   const targetId = await this.requestInput({
   *     type: 'target',
   *     targetType: 'enemy_unit',
   *     validTargetIds: enemies.map(e => e.id),
   *     context: 'Archer Deploy ability'
   *   });
   */
  protected requestInput(request: InputRequest): Promise<any> {
    return new Promise((resolve) => {
      // Store the resolve function so submitInput() can call it
      this.engine.pendingInputResolve = resolve;

      // Emit INPUT_REQUIRED event
      this.engine.emitEvent({
        type: 'INPUT_REQUIRED',
        playerId: this.owner,
        inputRequest: request,
      });
    });
  }

  // ========== Lifecycle Hooks ==========
  // These are called automatically by effects
  // Now async to support requestInput() calls

  /**
   * Called when this unit is deployed to a terrain
   */
  async onDeploy(): Promise<void> {
    // Override in subclasses
  }

  /**
   * Called when this unit dies (any reason)
   */
  async onDeath(): Promise<void> {
    // Override in subclasses
  }

  /**
   * Called when this unit conquers its terrain
   */
  async onConquer(): Promise<void> {
    // Override in subclasses
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
    // Override in subclasses
  }

  /**
   * Called when this unit is consumed (by another unit or action)
   */
  onConsumed?(_consumingUnit: UnitCard | null): void;
  // Optional - override in cards with Consumed: abilities

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
  activate(): void {
    if (!this.canActivate()) return;
    this.activateAbility!.activate();
    this.activateAbility!.cooldownRemaining = this.activateAbility!.cooldownMax;

    this.engine.emitEvent({
      type: 'ABILITY_ACTIVATED',
      unitId: this.id,
      abilityName: this.activateAbility!.description,
    });
  }

  /**
   * Reduce cooldown by 1 (called at start of owner's turn)
   */
  reduceCooldown(): void {
    if (!this.activateAbility) return;
    if (this.activateAbility.cooldownRemaining > 0) {
      this.activateAbility.cooldownRemaining--;

      this.engine.emitEvent({
        type: 'COOLDOWN_REDUCED',
        unitId: this.id,
        newCooldown: this.activateAbility.cooldownRemaining,
      });
    }
  }

  // ========== Helper Methods ==========

  /**
   * Add power to this unit (buff)
   */
  addPower(amount: number): void {
    const oldPower = this.power;
    this.power += amount;

    this.engine.emitEvent({
      type: 'UNIT_POWER_CHANGED',
      unitId: this.id,
      terrainId: this.terrainId!,
      oldPower,
      newPower: this.power,
      amount,
    });

    this.onPowerChanged(oldPower, this.power);
  }

  /**
   * Deal damage to this unit (reduce power)
   */
  dealDamage(amount: number): void {
    const oldPower = this.power;
    this.power -= amount;
    if (this.power < 0) this.power = 0;

    this.engine.emitEvent({
      type: 'UNIT_DAMAGED',
      unitId: this.id,
      terrainId: this.terrainId!,
      amount,
      newPower: this.power,
    });

    this.onPowerChanged(oldPower, this.power);
  }

  /**
   * Heal this unit (restore power up to original)
   * Note: Keep for future use, not used by V2 cards
   */
  heal(amount: number): void {
    const oldPower = this.power;
    this.power = Math.min(this.power + amount, this.originalPower);
    const actualHealed = this.power - oldPower;

    if (actualHealed > 0) {
      this.engine.emitEvent({
        type: 'UNIT_HEALED',
        unitId: this.id,
        terrainId: this.terrainId!,
        amount: actualHealed,
        newPower: this.power,
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
   */
  canBeConsumed(): boolean {
    return true;  // Override in specific cards if needed
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
   * Target parameter type depends on the specific card
   */
  abstract play(target?: unknown): void;
}
