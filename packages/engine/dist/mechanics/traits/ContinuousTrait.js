import { Trait } from './Trait';
/**
 * ContinuousTrait
 * Base class for all passive traits (Auras, Rule Modifiers).
 * Handles the lifecycle of registering/unregistering rules with the engine.
 */
export class ContinuousTrait extends Trait {
    constructor(name, owner) {
        super(name);
        if (owner) {
            this.owner = owner;
        }
    }
    /**
     * Called when the unit is deployed.
     * Registers the passive rules.
     */
    async onDeploy() {
        this.register();
    }
    /**
     * Called when the unit leaves the board (e.g. bounce, death cleanup).
     * Unregisters the passive rules.
     */
    onLeave() {
        this.unregister();
    }
    /**
     * Called when the trait is detached (e.g. Cleanse).
     * Unregisters the passive rules.
     */
    onDetach() {
        this.unregister();
    }
    /**
     * Unregister all rules associated with this trait ID.
     */
    unregister() {
        if (this.engine && this.engine.ruleManager) {
            this.engine.ruleManager.unregisterRule(this.id);
        }
    }
}
