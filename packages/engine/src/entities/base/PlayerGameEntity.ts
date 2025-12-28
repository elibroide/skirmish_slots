import { GameEntity } from './GameEntity';
import type { GameEngine } from '../../core/GameEngine';
import type { PlayerId, InputRequest } from '../../core/types';

/**
 * Base class for entities that are owned by a specific player.
 * Enables player-specific interactions like input requests.
 */
export abstract class PlayerGameEntity extends GameEntity {
  owner: PlayerId;

  constructor(engine: GameEngine, owner: PlayerId) {
    super(engine);
    this.owner = owner;
  }

  /**
   * Request player input (targeting, modal choices, etc.)
   * This method suspends execution until player provides input.
   */
  requestInput(request: InputRequest): Promise<any> {
    return new Promise(async (resolve) => {
      // Store the resolve function FIRST so submitInput() can call it
      this.engine.pendingInputResolve = resolve;
      
      // THEN emit INPUT_REQUIRED event
      await this.engine.emitEvent({
        type: 'INPUT_REQUIRED',
        playerId: this.owner,
        inputRequest: request,
      });
    });
  }
}
