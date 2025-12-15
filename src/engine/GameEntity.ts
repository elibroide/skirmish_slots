import type { GameEngine } from './GameEngine';
import type { PlayerId, InputRequest } from './types';

/**
 * Base class for all game entities that can interact with the engine.
 * Provides common functionality like requesting player input.
 *
 * Extended by:
 * - Card (units and actions)
 * - Leader (leader abilities)
 */
export abstract class GameEntity {
  engine: GameEngine;
  owner: PlayerId;

  constructor(engine: GameEngine, owner: PlayerId) {
    this.engine = engine;
    this.owner = owner;
  }

  /**
   * Request player input (targeting, modal choices, etc.)
   * This method suspends execution until player provides input.
   *
   * Example:
   *   const targetId = await this.requestInput({
   *     type: 'target',
   *     targetType: 'enemy_unit',
   *     validTargetIds: enemies.map(e => e.id),
   *     context: 'Choose a target'
   *   });
   */
  requestInput(request: InputRequest): Promise<any> {
    return new Promise(async (resolve) => {
      // Store the resolve function FIRST so submitInput() can call it
      this.engine.pendingInputResolve = resolve;
      console.log('[GameEntity] pendingInputResolve set, emitting INPUT_REQUIRED');

      // THEN emit INPUT_REQUIRED event
      await this.engine.emitEvent({
        type: 'INPUT_REQUIRED',
        playerId: this.owner,
        inputRequest: request,
      });
      console.log('[GameEntity] INPUT_REQUIRED event emitted, waiting for input...');
    });
  }
}
