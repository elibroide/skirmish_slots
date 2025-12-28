import type { GameEvent, PlayerId } from '../core/types';

/**
 * Interface for any player controller (Human, AI, Network, Recording, etc.)
 *
 * Controllers listen to game events and can respond to ACTION_REQUIRED events
 * by submitting actions back to the engine.
 */
export interface PlayerController {
  /**
   * Which player this controller controls
   */
  playerId: PlayerId;

  /**
   * Type of controller for identification
   */
  type: 'human' | 'ai' | 'network' | 'recording';

  /**
   * Called for every game event.
   * Controllers can listen for ACTION_REQUIRED, TARGET_REQUIRED, etc.
   */
  onEvent(event: GameEvent): void;
}
