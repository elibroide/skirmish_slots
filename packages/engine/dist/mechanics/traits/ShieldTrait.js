import { Trait } from './Trait';
import { TriggerEffect } from '../effects/TriggerEffect';
/**
 * ShieldTrait intercepts incoming damage
 * Used for future cards that can give shield to units
 */
export class ShieldTrait extends Trait {
    constructor(config, owner) {
        super(`Shield:${config.amount}`);
        Object.defineProperty(this, "shieldAmount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "duration", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.shieldAmount = config.amount;
        this.duration = config.duration || 'UNTIL_DEPLETED';
        if (owner) {
            this.owner = owner;
        }
    }
    /**
     * Intercept incoming damage and block it with shield
     */
    interceptDamage(amount) {
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
        }); // Type will be added to GameEvent later
        // Auto-remove if depleted and duration is UNTIL_DEPLETED
        if (this.shieldAmount <= 0 && this.duration === 'UNTIL_DEPLETED') {
            // Schedule removal using the effect stack (avoiding setTimeout and interference with current iteration)
            // Note: TriggerEffect must be imported at module level
            this.engine.addInterrupt(new TriggerEffect(this.owner, 'Shield Depleted', async () => {
                this.owner.removeTrait(this.id);
            }));
        }
        return amount - blocked;
    }
    /**
     * Get current shield amount
     */
    getShieldAmount() {
        return this.shieldAmount;
    }
}
