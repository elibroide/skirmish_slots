/**
 * Event emitter for game events.
 * Allows UI and other systems to subscribe to game state changes.
 */
export class EventEmitter<T> {
  private listeners: Array<(event: T) => Promise<void> | void> = [];

  /**
   * Subscribe to game events.
   * Returns an unsubscribe function.
   */
  subscribe(callback: (event: T) => Promise<void> | void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Emit an event to all subscribers.
   * Now async to support awaiting listeners.
   */
  async emit(event: T): Promise<void> {
    // Execute all listeners in parallel
    const promises = this.listeners.map(async (listener) => {
      try {
        await listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
        console.error('Event:', event);
      }
    });

    await Promise.all(promises);
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
