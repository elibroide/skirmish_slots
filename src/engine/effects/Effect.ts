import type { EffectResult, GameState } from '../types';
import type { GameEngine } from '../GameEngine';

/**
 * Base class for all effects in the game.
 * Effects encapsulate game actions that can be queued and executed.
 */
export abstract class Effect {
  protected engine!: GameEngine;

  /**
   * Set the engine reference (called by GameEngine when enqueueing)
   */
  setEngine(engine: GameEngine): void {
    this.engine = engine;
  }

  /**
   * Execute this effect on the given game state.
   * Returns the new state and any events that occurred.
   *
   * NOTE: Effects should NOT mutate the input state directly.
   * However, for performance, we're using a mutable state approach
   * where effects modify state in place. This is acceptable since
   * the GameEngine controls access to the state.
   */
  abstract execute(state: GameState): EffectResult;

  /**
   * Optional: Get a description of this effect for debugging/logging
   */
  getDescription(): string {
    return this.constructor.name;
  }
}
