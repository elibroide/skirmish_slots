/**
 * Seeded Random Number Generator using Linear Congruential Generator (LCG)
 *
 * Provides deterministic pseudo-random number generation for multiplayer synchronization.
 * All players using the same seed will generate identical sequences of random numbers.
 */
export class SeededRNG {
    constructor(seed) {
        Object.defineProperty(this, "seed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // LCG parameters (from Numerical Recipes)
        Object.defineProperty(this, "a", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1664525
        });
        Object.defineProperty(this, "c", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1013904223
        });
        Object.defineProperty(this, "m", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 2 ** 32
        });
        this.seed = seed >>> 0; // Ensure 32-bit unsigned integer
    }
    /**
     * Generate next random number in range [0, 1)
     */
    next() {
        this.seed = (this.a * this.seed + this.c) % this.m;
        return this.seed / this.m;
    }
    /**
     * Generate random integer in range [min, max) (max exclusive)
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min)) + min;
    }
    /**
     * Shuffle array in-place using Fisher-Yates algorithm with deterministic RNG
     */
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i + 1);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    /**
     * Get current seed value (useful for debugging)
     */
    getSeed() {
        return this.seed;
    }
    /**
     * Reset to a new seed
     */
    reset(newSeed) {
        this.seed = newSeed >>> 0;
    }
}
