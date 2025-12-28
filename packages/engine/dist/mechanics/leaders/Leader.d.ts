import type { GameEngine } from '../../core/GameEngine';
import type { PlayerId, LeaderDefinition } from '../../core/types';
import { PlayerGameEntity } from '../../entities/base/PlayerGameEntity';
/**
 * Base class for leader cards.
 * Like UnitCard and ActionCard, Leader extends PlayerGameEntity.
 * Extend this class to implement specific leader abilities.
 */
export declare abstract class Leader extends PlayerGameEntity {
    definition: LeaderDefinition;
    constructor(engine: GameEngine, owner: PlayerId, definition: LeaderDefinition);
    /**
     * Execute the leader ability.
     * This is called when the player activates their leader.
     */
    abstract execute(): Promise<void>;
    /**
     * Check if the ability can be activated.
     * Override this for abilities with additional conditions.
     * By default, always returns true (charge check is done elsewhere).
     */
    canActivate(): boolean;
}
/**
 * A LeaderInstance combines a definition (static data) with an ability (behavior).
 */
export interface LeaderInstance {
    definition: LeaderDefinition;
    ability: Leader | null;
}
