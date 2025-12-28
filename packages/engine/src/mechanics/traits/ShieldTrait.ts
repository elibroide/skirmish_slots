import type { EffectResult, GameEvent } from '../../core/types';
import { Trait } from './Trait';
import type { UnitCard } from '../cards/Card';
import { TriggerEffect } from '../effects/TriggerEffect';

export type ShieldDuration = 'PERMANENT' | 'THIS_ROUND' | 'UNTIL_DEPLETED';

export interface ShieldConfig {
  amount: number;
  duration?: ShieldDuration;
}

/**
 * ShieldTrait intercepts incoming damage
 * Used for future cards that can give shield to units
 */
export class ShieldTrait extends Trait {
  private shieldAmount: number;
  private duration: ShieldDuration;

  constructor(
    config: ShieldConfig,
    owner?: UnitCard
  ) {
    super(`Shield:${config.amount}`);
    this.shieldAmount = config.amount;
    this.duration = config.duration || 'UNTIL_DEPLETED';
    if (owner) {
      this.owner = owner;
    }
  }

  /**
   * Intercept incoming damage and block it with shield
   */
  interceptDamage(amount: number): number {
    if (this.shieldAmount <= 0) {
      return amount; // Shield depleted
    }

    const blocked = Math.min(amount, this.shieldAmount);
    this.shieldAmount -= blocked;

    // Emit shield event
    this.engine.emitEvent({
      type: 'SHIELD_BLOCKED',
      unitId: this.owner.id,
      blocked,
      remaining: this.shieldAmount
    } as any); // Type will be added to GameEvent later

    // Auto-remove if depleted and duration is UNTIL_DEPLETED
    if (this.shieldAmount <= 0 && this.duration === 'UNTIL_DEPLETED') {
      // Schedule removal using the effect stack (avoiding setTimeout and interference with current iteration)
      // Note: TriggerEffect must be imported at module level
      this.engine.addInterrupt(
        new TriggerEffect(this.owner, 'Shield Depleted', async () => {
          this.owner.removeTrait(this.id);
        })
      );
    }

    return amount - blocked;
  }

  /**
   * Get current shield amount
   */
  getShieldAmount(): number {
    return this.shieldAmount;
  }
}

