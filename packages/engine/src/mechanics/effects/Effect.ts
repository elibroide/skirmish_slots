import type { EffectResult, GameState } from '../../core/types';
import type { GameEngine } from '../../core/GameEngine';

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
   *
   * Effects are now async to support input requests (targeting, modal choices, etc.)
   * Most effects won't await anything, but effects that trigger card hooks (like
   * DeployUnitEffect) may await if the card requests player input.
   */
  abstract execute(state: GameState): Promise<EffectResult>;

  /**
   * Optional: Get a description of this effect for debugging/logging
   */
  getDescription(): string {
    return this.constructor.name;
  }
}
