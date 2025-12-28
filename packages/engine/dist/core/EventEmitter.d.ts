/**
 * Event emitter for game events.
 * Allows UI and other systems to subscribe to game state changes.
 */
export declare class EventEmitter<T> {
    private listeners;
    /**
     * Subscribe to game events.
     * Returns an unsubscribe function.
     */
    subscribe(callback: (event: T) => Promise<void> | void): () => void;
    /**
     * Emit an event to all subscribers.
     * Now async to support awaiting listeners.
     */
    emit(event: T): Promise<void>;
    /**
     * Get the number of active listeners (useful for debugging)
     */
    get listenerCount(): number;
    /**
     * Clear all listeners
     */
    clear(): void;
}
