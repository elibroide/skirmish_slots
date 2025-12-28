import { PlayerGameEntity } from '../../entities/base/PlayerGameEntity';
/**
 * Base class for leader cards.
 * Like UnitCard and ActionCard, Leader extends PlayerGameEntity.
 * Extend this class to implement specific leader abilities.
 */
export class Leader extends PlayerGameEntity {
    constructor(engine, owner, definition) {
        super(engine, owner);
        Object.defineProperty(this, "definition", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.definition = definition;
    }
    /**
     * Check if the ability can be activated.
     * Override this for abilities with additional conditions.
     * By default, always returns true (charge check is done elsewhere).
     */
    canActivate() {
        return true;
    }
}
