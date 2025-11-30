import type { PlayerId, SlotId, TargetInfo, GameState, UnitCard as IUnitCard } from '../types';
import type { GameEngine } from '../GameEngine';
import { generateId } from '../../utils/helpers';

/**
 * Base class for all cards
 */
export abstract class Card {
  id: string; // Unique instance ID
  cardId: string; // Card type ID (e.g., "scout")
  name: string;
  owner: PlayerId;
  engine: GameEngine;

  constructor(cardId: string, name: string, owner: PlayerId, engine: GameEngine) {
    this.id = generateId();
    this.cardId = cardId;
    this.name = name;
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
  selectDefaultTarget(state: GameState): string | SlotId | null {
    const targets = this.getValidTargets(state);

    if (targets.type === 'enemy_unit' || targets.type === 'ally_unit' || targets.type === 'unit') {
      return targets.validUnitIds[0] || null;
    }

    if (targets.type === 'slot') {
      return targets.validSlotIds[0] ?? null;
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
  slotId: SlotId | null = null;

  constructor(cardId: string, name: string, power: number, owner: PlayerId, engine: GameEngine) {
    super(cardId, name, owner, engine);
    this.power = power;
    this.originalPower = power;
  }

  getType(): 'unit' {
    return 'unit';
  }

  // ========== Lifecycle Hooks ==========
  // These are called automatically by effects

  /**
   * Called when this unit is deployed to a slot
   */
  onDeploy(): void {
    // Override in subclasses
  }

  /**
   * Called when this unit dies (any reason)
   */
  onDeath(): void {
    // Override in subclasses
  }

  /**
   * Called when this unit conquers its slot
   */
  onConquer(): void {
    // Override in subclasses
  }

  /**
   * Called when this unit's power changes
   */
  onPowerChanged(_oldPower: number, _newPower: number): void {
    // Override in subclasses
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
      slotId: this.slotId!,
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
      slotId: this.slotId!,
      amount,
      newPower: this.power,
    });

    this.onPowerChanged(oldPower, this.power);
  }

  /**
   * Heal this unit (restore power up to original)
   */
  heal(amount: number): void {
    const oldPower = this.power;
    this.power = Math.min(this.power + amount, this.originalPower);
    const actualHealed = this.power - oldPower;

    if (actualHealed > 0) {
      this.engine.emitEvent({
        type: 'UNIT_HEALED',
        unitId: this.id,
        slotId: this.slotId!,
        amount: actualHealed,
        newPower: this.power,
      });

      this.onPowerChanged(oldPower, this.power);
    }
  }

  /**
   * Get close ally units (adjacent slots)
   */
  getCloseAllies(): UnitCard[] {
    return this.engine.getCloseUnits(this.slotId, this.owner, 'ally');
  }

  /**
   * Get close enemy units (adjacent slots)
   */
  getCloseEnemies(): UnitCard[] {
    return this.engine.getCloseUnits(this.slotId, this.owner, 'enemy');
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
