import type { LeaderDefinition, PlayerId } from '../types';
import type { GameEngine } from '../GameEngine';
import { GameEntity } from '../GameEntity';

/**
 * Base class for leader cards.
 * Like UnitCard and ActionCard, LeaderCard extends GameEntity.
 * Extend this class to implement specific leader abilities.
 */
export abstract class LeaderCard extends GameEntity {
  definition: LeaderDefinition;

  constructor(definition: LeaderDefinition, engine: GameEngine, owner: PlayerId) {
    super(engine, owner);
    this.definition = definition;
  }

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
  canActivate(): boolean {
    return true;
  }
}

/**
 * A LeaderInstance combines a definition (static data) with an ability (behavior).
 */
export interface LeaderInstance {
  definition: LeaderDefinition;
  ability: LeaderCard | null; // null for leaders without abilities (e.g., Rookie)
}
