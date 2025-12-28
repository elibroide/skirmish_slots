import type { GameState } from '../core/types';
/**
 * StateHasher - Generate deterministic checksums from GameState
 *
 * Creates SHA-256 hashes of game state for desync detection in multiplayer.
 * All clients executing the same commands should produce identical checksums.
 */
export declare class StateHasher {
    /**
     * Generate a deterministic hash of the game state
     * Returns first 16 characters of hex hash for compact representation
     */
    static hashState(state: GameState): Promise<string>;
    /**
     * Synchronous version for cases where async is not possible
     * Uses simpler hash algorithm (FNV-1a)
     */
    static hashStateSync(state: GameState): string;
    /**
     * Convert GameState to canonical JSON string
     * - Sorts all object keys
     * - Excludes non-deterministic fields
     * - Handles circular references safely
     */
    private static canonicalize;
    /**
     * SHA-256 hash using Web Crypto API (async)
     */
    private static sha256;
    /**
     * FNV-1a hash (synchronous fallback)
     * Simple, fast, deterministic hash function
     */
    private static fnv1a;
}
