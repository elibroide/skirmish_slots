export class EffectStack {
    constructor() {
        Object.defineProperty(this, "stack", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
    }
    /**
     * Pushes a single effect to the TOP of the stack.
     * Use this for Interrupts, Reactions, and Triggers.
     * It will be executed NEXT.
     */
    push(effect) {
        this.stack.push(effect);
    }
    /**
     * Pushes a list of effects to be executed in the provided order.
     * [A, B, C] -> Pushes C, then B, then A.
     * Result: A is on top (executes first), then B, then C.
     */
    pushSequence(effects) {
        // Iterate backwards so the first element ends up on top
        for (let i = effects.length - 1; i >= 0; i--) {
            this.stack.push(effects[i]);
        }
    }
    /**
     * Remove and return the top effect from the stack (LIFO)
     */
    pop() {
        return this.stack.pop();
    }
    /**
     * Check if the stack is empty
     */
    isEmpty() {
        return this.stack.length === 0;
    }
    /**
     * Get the current size of the stack
     */
    size() {
        return this.stack.length;
    }
    /**
     * Clear all effects from the stack
     */
    clear() {
        this.stack = [];
    }
    /**
     * Peek at the next effect without removing it
     */
    peek() {
        return this.stack[this.stack.length - 1];
    }
}
