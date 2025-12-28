/**
 * Event emitter for game events.
 * Allows UI and other systems to subscribe to game state changes.
 */
export class EventEmitter {
    constructor() {
        Object.defineProperty(this, "listeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
    }
    /**
     * Subscribe to game events.
     * Returns an unsubscribe function.
     */
    subscribe(callback) {
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
    async emit(event) {
        // Execute all listeners in parallel
        const promises = this.listeners.map(async (listener) => {
            try {
                await listener(event);
            }
            catch (error) {
                console.error('Error in event listener:', error);
                console.error('Event:', event);
            }
        });
        await Promise.all(promises);
    }
    /**
     * Get the number of active listeners (useful for debugging)
     */
    get listenerCount() {
        return this.listeners.length;
    }
    /**
     * Clear all listeners
     */
    clear() {
        this.listeners = [];
    }
}
