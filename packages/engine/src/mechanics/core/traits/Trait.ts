import type { UnitCard } from '../../cards/Card';
import type { GameEngine } from '../../../core/GameEngine';

/**
 * Base class for all traits (components in ECS pattern)
 * Traits are composable behaviors that can be attached to cards
 */
export abstract class Trait {
  id: string;
  name: string;
  owner!: UnitCard;

  constructor(name: string) {
    this.name = name;
    this.id = `trait_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Called when this trait is attached to a card
   */
  onAttach(card: UnitCard): void {
    this.owner = card;
  }

  /**
   * Called when this trait is detached from a card
   */
  onDetach(): void {
    // Override in subclasses for cleanup
  }

  /**
   * Called when the owning unit leaves the battlefield
   */
  onLeave(): void {
    // Override in subclasses for cleanup
  }

  /**
   * Called when the owning unit is deployed
   */
  async onDeploy(): Promise<void> {
    // Override in subclasses
  }

  /**
   * Called when the owning unit dies
   */
  async onDeath(): Promise<void> {
    // Override in subclasses
  }

  /**
   * Called when the owning unit conquers a terrain
   */
  async onConquer(): Promise<void> {
    // Override in subclasses
  }

  /**
   * Called at the start of the owner's turn
   */
  onTurnStart(): void {
    // Override in subclasses
  }

  /**
   * Called when the owning unit is consumed by another unit
   */
  onConsumed?(consumingUnit: UnitCard | null): void;

  /**
   * Called when the owning unit consumes another unit
   */
  onConsume?(victim: UnitCard): void;

  /**
   * Allows trait to modify the unit's effective power
   * Called during power calculation
   */
  modifyPower(currentPower: number): number {
    return currentPower;
  }

  /**
   * Allows trait to intercept/modify incoming damage
   * Return the actual damage to be applied (after trait processing)
   */
  interceptDamage(amount: number): number {
    return amount;
  }

  /**
   * Helper to get the game engine
   */
  protected get engine(): GameEngine {
    return this.owner.engine;
  }
}

