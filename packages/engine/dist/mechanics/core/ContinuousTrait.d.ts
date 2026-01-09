import { Trait } from './Trait';
import type { UnitCard } from '../cards/Card';
/**
 * ContinuousTrait
 * Base class for all passive traits (Auras, Rule Modifiers).
 * Handles the lifecycle of registering/unregistering rules with the engine.
 */
export declare abstract class ContinuousTrait extends Trait {
    constructor(name: string, owner?: UnitCard);
    /**
     * Called when the unit is deployed.
     * Registers the passive rules.
     */
    onDeploy(): Promise<void>;
    /**
     * Called when the unit leaves the board (e.g. bounce, death cleanup).
     * Unregisters the passive rules.
     */
    onLeave(): void;
    /**
     * Called when the trait is detached (e.g. Cleanse).
     * Unregisters the passive rules.
     */
    onDetach(): void;
    /**
     * Unregister all rules associated with this trait ID.
     */
    protected unregister(): void;
    /**
     * Abstract method for subclasses to register their specific rules.
     */
    protected abstract register(): void;
}
