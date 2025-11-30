import type { Effect } from './effects/Effect';

/**
 * FIFO queue for processing effects.
 * Effects are processed in the order they are enqueued.
 */
export class EffectQueue {
  private queue: Effect[] = [];

  /**
   * Add an effect to the end of the queue
   */
  enqueue(effect: Effect): void {
    this.queue.push(effect);
  }

  /**
   * Remove and return the first effect from the queue
   */
  dequeue(): Effect | undefined {
    return this.queue.shift();
  }

  /**
   * Check if the queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Get the current size of the queue
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear all effects from the queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Peek at the next effect without removing it
   */
  peek(): Effect | undefined {
    return this.queue[0];
  }
}
