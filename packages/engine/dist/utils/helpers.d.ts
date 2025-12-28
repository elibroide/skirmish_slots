/**
 * Generate a unique ID for cards, effects, etc.
 */
export declare function generateId(): string;
/**
 * Shuffle an array in place using Fisher-Yates algorithm
 */
export declare function shuffle<T>(array: T[]): T[];
/**
 * Create a deep clone of an object
 */
export declare function deepClone<T>(obj: T): T;
