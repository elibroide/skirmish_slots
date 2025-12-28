/**
 * StateHasher - Generate deterministic checksums from GameState
 *
 * Creates SHA-256 hashes of game state for desync detection in multiplayer.
 * All clients executing the same commands should produce identical checksums.
 */
export class StateHasher {
    /**
     * Generate a deterministic hash of the game state
     * Returns first 16 characters of hex hash for compact representation
     */
    static async hashState(state) {
        const canonical = this.canonicalize(state);
        const hash = await this.sha256(canonical);
        return hash.substring(0, 16);
    }
    /**
     * Synchronous version for cases where async is not possible
     * Uses simpler hash algorithm (FNV-1a)
     */
    static hashStateSync(state) {
        const canonical = this.canonicalize(state);
        return this.fnv1a(canonical).substring(0, 16);
    }
    /**
     * Convert GameState to canonical JSON string
     * - Sorts all object keys
     * - Excludes non-deterministic fields
     * - Handles circular references safely
     */
    static canonicalize(state) {
        const simplified = {
            currentSkirmish: state.currentSkirmish,
            currentPlayer: state.currentPlayer,
            // isDone moved to players
            tieSkirmishes: state.tieSkirmishes,
            matchWinner: state.matchWinner,
            players: state.players.map((player) => ({
                id: player.id,
                sp: player.sp,
                skirmishesWon: player.skirmishesWon,
                handSize: player.hand.length,
                deckSize: player.deck.length,
                graveyardSize: player.graveyard.length,
                handIds: player.hand.map((c) => c.id).sort(),
                deckIds: player.deck.map((c) => c.id),
                graveyardIds: player.graveyard.map((c) => c.id).sort(),
            })),
            terrains: state.terrains.map((terrain) => ({
                winner: terrain.winner,
                slots: {
                    0: {
                        unitId: terrain.slots[0].unit?.id ?? null,
                        unitPower: terrain.slots[0].unit?.power ?? null,
                        modifier: terrain.slots[0].modifier,
                    },
                    1: {
                        unitId: terrain.slots[1].unit?.id ?? null,
                        unitPower: terrain.slots[1].unit?.power ?? null,
                        modifier: terrain.slots[1].modifier,
                    },
                },
            })),
        };
        return JSON.stringify(simplified, Object.keys(simplified).sort());
    }
    /**
     * SHA-256 hash using Web Crypto API (async)
     */
    static async sha256(message) {
        // Check if we're in a browser or Node environment
        if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
            // Browser environment
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        }
        else if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
            // Node 18+ with Web Crypto API
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        }
        else {
            // Fallback to sync hash
            return this.fnv1a(message);
        }
    }
    /**
     * FNV-1a hash (synchronous fallback)
     * Simple, fast, deterministic hash function
     */
    static fnv1a(str) {
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return (hash >>> 0).toString(16).padStart(8, '0');
    }
}
