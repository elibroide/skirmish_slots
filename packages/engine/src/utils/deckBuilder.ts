import type { PlayerId } from '../core/types';
import type { GameEngine } from '../core/GameEngine';
import type { Card } from '../mechanics/cards/Card';
import { createDeck } from '../mechanics/cards';
import { shuffle } from './helpers';

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
import { integratedCards } from '../data/cards/index';

/**
 * Create a balanced 25-card starter deck
 * Dynamically built from integratedCards with type="Game"
 */
export function createStarterDeck(owner: PlayerId, engine: GameEngine): Card[] {
    // 1. Filter for valid game cards
    const gameCards = integratedCards.filter(card => 
        (card as any).type === 'Game'
    );
    
    // 2. Extract IDs
    let deckList = gameCards.map(card => card.id);

    // 3. Duplicate until we have at least 24 cards
    while (deckList.length < 24) {
        deckList = [...deckList, ...gameCards.map(c => c.id)];
    }

    // 4. Trim to reasonable size if needed (optional, but let's keep it unbound or cap at 30? logic asks for ~24)
    // The user asked to "duplicate some because I don't have 24 cards", so growing is right.
    // If we have very few cards, we might have massive duplicates.
    
    const cards = createDeck(deckList, owner, engine);
    return shuffle(cards);
}

/**
 * Create a minimal test deck for quick testing
 */
export function createTestDeck(owner: PlayerId, engine: GameEngine): Card[] {
  const deckList = [
    'turret', 'turret',
    'turret', 'turret',
    'rogue', 'rogue',
    'ninja', 'ninja',
    'vampire', 'vampire',
    'turret', 'turret',
    'turret', 'turret',
  ];

  const cards = createDeck(deckList, owner, engine);
  return shuffle(cards);
}

/**
 * Starter Deck 1: "Aggro Thieves" - Fast damage and stealing resources
 * Features all new cards from conversation: thief, zombie, berserker, armsPeddler, spike, brawl
 */
/**
 * Starter Deck 1: "Simple Aggro" - Vanilla stats and simple damage
 * strictly for testing basic mechanics (Deploy, Death, Turn Passing)
 */
export function createStarter1Deck(owner: PlayerId, engine: GameEngine): Card[] {
  // Redirect to the main dynamic deck for now
  return createStarterDeck(owner, engine);
}

/**
 * Starter Deck 2: "Simple Defense" - Vanilla stats and simple control
 * strictly for testing basic mechanics
 */
export function createStarter2Deck(owner: PlayerId, engine: GameEngine): Card[] {
   // Redirect to the main dynamic deck for now
   return createStarterDeck(owner, engine);
}

/**
 * Create a starter deck with a specific leader
 */
export function createStarterDeckWithLeader(
  owner: PlayerId,
  engine: GameEngine,
  leaderId?: string
): DeckWithLeader {
  const cards = createStarterDeck(owner, engine);
  return {
    cards,
    leaderId: leaderId || 'rookie',
  };
}

/**
 * Create a deck from a configuration object
 */
export function createDeckFromConfig(
  config: DeckConfig,
  owner: PlayerId,
  engine: GameEngine
): DeckWithLeader {
  const cards = createDeck(config.cardIds, owner, engine);
  return {
    cards: shuffle(cards),
    leaderId: config.leaderId || 'rookie',
  };
}
