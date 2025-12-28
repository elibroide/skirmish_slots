import { Effect } from '../mechanics/effects/Effect';
export declare class EffectStack {
    private stack;
    /**
     * Pushes a single effect to the TOP of the stack.
     * Use this for Interrupts, Reactions, and Triggers.
     * It will be executed NEXT.
     */
    push(effect: Effect): void;
    /**
     * Pushes a list of effects to be executed in the provided order.
     * [A, B, C] -> Pushes C, then B, then A.
     * Result: A is on top (executes first), then B, then C.
     */
    pushSequence(effects: Effect[]): void;
    /**
     * Remove and return the top effect from the stack (LIFO)
     */
    pop(): Effect | undefined;
    /**
     * Check if the stack is empty
     */
    isEmpty(): boolean;
    /**
     * Get the current size of the stack
     */
    size(): number;
    /**
     * Clear all effects from the stack
     */
    clear(): void;
    /**
     * Peek at the next effect without removing it
     */
    peek(): Effect | undefined;
}
