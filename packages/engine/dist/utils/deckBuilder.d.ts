import type { PlayerId } from '../core/types';
import type { GameEngine } from '../core/GameEngine';
import type { Card } from '../mechanics/cards/Card';
/**
 * Deck configuration with optional leader
 */
export interface DeckConfig {
    cardIds: string[];
    leaderId?: string;
}
/**
 * Result of creating a deck with leader
 */
export interface DeckWithLeader {
    cards: Card[];
    leaderId: string;
}
/**
 * Create a balanced 25-card starter deck
 * Spread across different card types for variety
 */
export declare function createStarterDeck(owner: PlayerId, engine: GameEngine): Card[];
/**
 * Create a minimal test deck for quick testing
 */
export declare function createTestDeck(owner: PlayerId, engine: GameEngine): Card[];
/**
 * Starter Deck 1: "Aggro Thieves" - Fast damage and stealing resources
 * Features all new cards from conversation: thief, zombie, berserker, armsPeddler, spike, brawl
 */
/**
 * Starter Deck 1: "Simple Aggro" - Vanilla stats and simple damage
 * strictly for testing basic mechanics (Deploy, Death, Turn Passing)
 */
export declare function createStarter1Deck(owner: PlayerId, engine: GameEngine): Card[];
/**
 * Starter Deck 2: "Simple Defense" - Vanilla stats and simple control
 * strictly for testing basic mechanics
 */
export declare function createStarter2Deck(owner: PlayerId, engine: GameEngine): Card[];
/**
 * Create a starter deck with a specific leader
 */
export declare function createStarterDeckWithLeader(owner: PlayerId, engine: GameEngine, leaderId?: string): DeckWithLeader;
/**
 * Create a deck from a configuration object
 */
export declare function createDeckFromConfig(config: DeckConfig, owner: PlayerId, engine: GameEngine): DeckWithLeader;
