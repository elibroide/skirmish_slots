import { Trait } from './Trait';
import type { UnitCard } from '../cards/Card';
export interface ActivateConfig {
    cooldownMax: number;
    description: string;
    effect: (owner: UnitCard) => Promise<void> | void;
}
/**
 * ActivateTrait handles player-activated abilities with cooldowns
 * Migrates the existing activateAbility property to the trait system
 */
export declare class ActivateTrait extends Trait {
    private cooldownMax;
    private cooldownRemaining;
    private description;
    private effect;
    constructor(config: ActivateConfig, owner?: UnitCard);
    onAttach(card: UnitCard): void;
    onTurnStart(): void;
    /**
     * Check if the ability can be activated
     */
    canActivate(): boolean;
    /**
     * Activate the ability
     */
    activate(): Promise<void>;
    onDetach(): void;
}
