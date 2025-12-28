/**
 * Base class for all traits (components in ECS pattern)
 * Traits are composable behaviors that can be attached to cards
 */
export class Trait {
    constructor(name) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "owner", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.name = name;
        this.id = `trait_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Called when this trait is attached to a card
     */
    onAttach(card) {
        this.owner = card;
    }
    /**
     * Called when this trait is detached from a card
     */
    onDetach() {
        // Override in subclasses for cleanup
    }
    /**
     * Called when the owning unit leaves the battlefield
     */
    onLeave() {
        // Override in subclasses for cleanup
    }
    /**
     * Called when the owning unit is deployed
     */
    async onDeploy() {
        // Override in subclasses
    }
    /**
     * Called when the owning unit dies
     */
    async onDeath() {
        // Override in subclasses
    }
    /**
     * Called when the owning unit conquers a terrain
     */
    async onConquer() {
        // Override in subclasses
    }
    /**
     * Called at the start of the owner's turn
     */
    onTurnStart() {
        // Override in subclasses
    }
    /**
     * Allows trait to modify the unit's effective power
     * Called during power calculation
     */
    modifyPower(currentPower) {
        return currentPower;
    }
    /**
     * Allows trait to intercept/modify incoming damage
     * Return the actual damage to be applied (after trait processing)
     */
    interceptDamage(amount) {
        return amount;
    }
    /**
     * Helper to get the game engine
     */
    get engine() {
        return this.owner.engine;
    }
}
