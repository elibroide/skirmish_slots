import { Effect } from './effects/Effect';

export class EffectStack {
  private stack: Effect[] = [];

  /**
   * Pushes a single effect to the TOP of the stack.
   * Use this for Interrupts, Reactions, and Triggers.
   * It will be executed NEXT.
   */
  push(effect: Effect): void {
    this.stack.push(effect);
  }

  /**
   * Pushes a list of effects to be executed in the provided order.
   * [A, B, C] -> Pushes C, then B, then A.
   * Result: A is on top (executes first), then B, then C.
   */
  pushSequence(effects: Effect[]): void {
    // Iterate backwards so the first element ends up on top
    for (let i = effects.length - 1; i >= 0; i--) {
      this.stack.push(effects[i]);
    }
  }

  /**
   * Remove and return the top effect from the stack (LIFO)
   */
  pop(): Effect | undefined {
    return this.stack.pop();
  }

  /**
   * Check if the stack is empty
   */
  isEmpty(): boolean {
    return this.stack.length === 0;
  }

  /**
   * Get the current size of the stack
   */
  size(): number {
    return this.stack.length;
  }

  /**
   * Clear all effects from the stack
   */
  clear(): void {
    this.stack = [];
  }

  /**
   * Peek at the next effect without removing it
   */
  peek(): Effect | undefined {
    return this.stack[this.stack.length - 1];
  }
}

