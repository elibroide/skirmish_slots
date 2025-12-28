import { Trait } from './Trait';
/**
 * ActivateTrait handles player-activated abilities with cooldowns
 * Migrates the existing activateAbility property to the trait system
 */
export class ActivateTrait extends Trait {
    constructor(config, owner) {
        super(`Activate:${config.description}`);
        Object.defineProperty(this, "cooldownMax", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cooldownRemaining", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "effect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.cooldownMax = config.cooldownMax;
        this.cooldownRemaining = 0; // Ready to use when deployed
        this.description = config.description;
        this.effect = config.effect;
        if (owner) {
            this.owner = owner;
        }
    }
    onAttach(card) {
        super.onAttach(card);
        // Register this trait as the unit's activateAbility
        // This maintains backward compatibility with existing system
        card.activateAbility = {
            cooldownMax: this.cooldownMax,
            cooldownRemaining: this.cooldownRemaining,
            description: this.description,
            activate: async () => {
                await this.activate();
            }
        };
    }
    onTurnStart() {
        // Reduce cooldown at start of owner's turn
        if (this.cooldownRemaining > 0) {
            this.cooldownRemaining--;
            // Update the card's activateAbility property
            if (this.owner.activateAbility) {
                this.owner.activateAbility.cooldownRemaining = this.cooldownRemaining;
            }
            this.engine.emitEvent({
                type: 'COOLDOWN_REDUCED',
                unitId: this.owner.id,
                newCooldown: this.cooldownRemaining
            });
        }
    }
    /**
     * Check if the ability can be activated
     */
    canActivate() {
        return this.cooldownRemaining === 0;
    }
    /**
     * Activate the ability
     */
    async activate() {
        if (!this.canActivate()) {
            return;
        }
        // Execute the effect
        await this.effect(this.owner);
        // Set cooldown
        this.cooldownRemaining = this.cooldownMax;
        // Update the card's activateAbility property
        if (this.owner.activateAbility) {
            this.owner.activateAbility.cooldownRemaining = this.cooldownRemaining;
        }
        // Emit event
        await this.engine.emitEvent({
            type: 'ABILITY_ACTIVATED',
            unitId: this.owner.id,
            abilityName: this.description
        });
    }
    onDetach() {
        // Clear the activateAbility property
        this.owner.activateAbility = undefined;
    }
}
