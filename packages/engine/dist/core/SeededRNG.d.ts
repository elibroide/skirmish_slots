/**
 * Seeded Random Number Generator using Linear Congruential Generator (LCG)
 *
 * Provides deterministic pseudo-random number generation for multiplayer synchronization.
 * All players using the same seed will generate identical sequences of random numbers.
 */
export declare class SeededRNG {
    private seed;
    private readonly a;
    private readonly c;
    private readonly m;
    constructor(seed: number);
    /**
     * Generate next random number in range [0, 1)
     */
    next(): number;
    /**
     * Generate random integer in range [min, max) (max exclusive)
     */
    nextInt(min: number, max: number): number;
    /**
     * Shuffle array in-place using Fisher-Yates algorithm with deterministic RNG
     */
    shuffle<T>(array: T[]): T[];
    /**
     * Get current seed value (useful for debugging)
     */
    getSeed(): number;
    /**
     * Reset to a new seed
     */
    reset(newSeed: number): void;
}
