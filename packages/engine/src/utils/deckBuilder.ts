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
export function createStarterDeck(owner: PlayerId, engine: GameEngine): Card[] {
  const deckList = [
    // Low Power Utility (5 cards)
    'scout', 'scout',               // 2x Scout (Draw)
    'engineer',                     // 1x Engineer (Slot buff)
    'warlock',                      // 1x Acolyte (Consume fodder)
    'mimic',                        // 1x Mimic (Copy power)
    
    // Mid Power Units (10 cards)
    'priest',                       // 1x Priest (Cleanse)
    'bard',                         // 1x Bard (Ongoing buff)
    'rogue',                        // 1x Roots (Death buff)
    'wizard',                       // 1x Wizard (Action synergy)
    'thief', 'thief',             // 2x Archer (Deploy damage)
    'turret',                       // 1x Turret (Ping damage)
    'underdog',                       // 1x Rookie (Activate buff)
    'sentinel',                     // 1x Sentinel (Block enemy)
    
    // High Power Units (5 cards)
    'champion', 'champion',         // 2x Champion (Pure stats)
    'hunter',                       // 1x Hunter (Kill wounded)
    'underdog',                        // 1x Noble (Conquer draw)
    'hunter',                       // 1x Ranger (Reposition)
    
    // Actions (5 cards)
    'strike', 'strike',             // 2x Strike (Direct damage)
    'fireball',                     // 1x Unsummon (Bounce)
    'seed',                         // 1x Seed (Slot buff)
    'energize',                     // 1x Energize (Unit buff)
  ];

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
  const deckList = [
    // Vanilla Units (Stat Sticks)
    'veteran', 'veteran', 'veteran',  // 3x Veteran (4)
    'champion', 'champion',           // 2x Champion (5)

    // Simple Deploy Effects
    'archer', 'archer', 'archer',     // 3x Archer (Deal 2 damage)
    'scout', 'scout',                 // 2x Scout (Draw 1)

    // Simple Actions
    'strike', 'strike',               // 2x Strike (Deal 3 damage)
  ];

  const cards = createDeck(deckList, owner, engine);
  return shuffle(cards);
}

/**
 * Starter Deck 2: "Simple Defense" - Vanilla stats and simple control
 * strictly for testing basic mechanics
 */
export function createStarter2Deck(owner: PlayerId, engine: GameEngine): Card[] {
  const deckList = [
    // Vanilla Units
    'veteran', 'veteran',             // 2x Veteran (4)
    'champion', 'champion', 'champion', // 3x Champion (5)

    // Simple Deploy Effects
    'warrior', 'warrior',             // 2x Warrior (Gain Shield)
    'scout', 'scout',                 // 2x Scout (Draw 1)

    // Simple Actions
    'unsummon', 'unsummon',           // 2x Unsummon (Return to hand)
    'strike',                         // 1x Strike (Deal 3)
  ];

  const cards = createDeck(deckList, owner, engine);
  return shuffle(cards);
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
