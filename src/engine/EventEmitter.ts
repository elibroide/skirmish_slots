import type { GameEvent } from './types';

/**
 * Event emitter for game events.
 * Allows UI and other systems to subscribe to game state changes.
 */
export class EventEmitter {
  private listeners: Array<(event: GameEvent) => void> = [];

  /**
   * Subscribe to game events.
   * Returns an unsubscribe function.
   */
  subscribe(callback: (event: GameEvent) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Emit an event to all subscribers.
   * Catches and logs errors in individual listeners to prevent one
   * bad listener from breaking others.
   */
  emit(event: GameEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
        console.error('Event:', event);
      }
    });
  }

  /**
   * Get the number of active listeners (useful for debugging)
   */
  get listenerCount(): number {
    return this.listeners.length;
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners = [];
  }
}
