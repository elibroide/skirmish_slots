import { Trait } from './Trait';
import type { UnitCard } from '../cards/Card';
export type ShieldDuration = 'PERMANENT' | 'THIS_ROUND' | 'UNTIL_DEPLETED';
export interface ShieldConfig {
    amount: number;
    duration?: ShieldDuration;
}
/**
 * ShieldTrait intercepts incoming damage
 * Used for future cards that can give shield to units
 */
export declare class ShieldTrait extends Trait {
    private shieldAmount;
    private duration;
    constructor(config: ShieldConfig, owner?: UnitCard);
    /**
     * Intercept incoming damage and block it with shield
     */
    interceptDamage(amount: number): number;
    /**
     * Get current shield amount
     */
    getShieldAmount(): number;
}
