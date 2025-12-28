import type { GameEngine } from '../../core/GameEngine';

/**
 * Base class for all game entities that can interact with the engine.
 */
export abstract class GameEntity {
  engine: GameEngine;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }
}
