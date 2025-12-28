/**
 * Seeded Random Number Generator using Linear Congruential Generator (LCG)
 * 
 * Provides deterministic pseudo-random number generation for multiplayer synchronization.
 * All players using the same seed will generate identical sequences of random numbers.
 */
export class SeededRNG {
  private seed: number;
  
  // LCG parameters (from Numerical Recipes)
  private readonly a = 1664525;
  private readonly c = 1013904223;
  private readonly m = 2 ** 32;

  constructor(seed: number) {
    this.seed = seed >>> 0; // Ensure 32-bit unsigned integer
  }

  /**
   * Generate next random number in range [0, 1)
   */
  next(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed / this.m;
  }

  /**
   * Generate random integer in range [min, max) (max exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Shuffle array in-place using Fisher-Yates algorithm with deterministic RNG
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Get current seed value (useful for debugging)
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Reset to a new seed
   */
  reset(newSeed: number): void {
    this.seed = newSeed >>> 0;
  }
}

