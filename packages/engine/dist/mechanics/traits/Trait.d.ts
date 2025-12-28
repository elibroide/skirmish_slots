import type { UnitCard } from '../cards/Card';
import type { GameEngine } from '../../core/GameEngine';
/**
 * Base class for all traits (components in ECS pattern)
 * Traits are composable behaviors that can be attached to cards
 */
export declare abstract class Trait {
    id: string;
    name: string;
    owner: UnitCard;
    constructor(name: string);
    /**
     * Called when this trait is attached to a card
     */
    onAttach(card: UnitCard): void;
    /**
     * Called when this trait is detached from a card
     */
    onDetach(): void;
    /**
     * Called when the owning unit leaves the battlefield
     */
    onLeave(): void;
    /**
     * Called when the owning unit is deployed
     */
    onDeploy(): Promise<void>;
    /**
     * Called when the owning unit dies
     */
    onDeath(): Promise<void>;
    /**
     * Called when the owning unit conquers a terrain
     */
    onConquer(): Promise<void>;
    /**
     * Called at the start of the owner's turn
     */
    onTurnStart(): void;
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
    modifyPower(currentPower: number): number;
    /**
     * Allows trait to intercept/modify incoming damage
     * Return the actual damage to be applied (after trait processing)
     */
    interceptDamage(amount: number): number;
    /**
     * Helper to get the game engine
     */
    protected get engine(): GameEngine;
}
