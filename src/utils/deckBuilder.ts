import type { PlayerId } from '../engine/types';
import type { GameEngine } from '../engine/GameEngine';
import type { Card } from '../engine/cards/Card';
import { createDeck } from '../engine/cards';
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
export function createStarter1Deck(owner: PlayerId, engine: GameEngine): Card[] {
  const deckList = [
    // New cards from conversation
    'thief', 'thief',               // 2x Thief (3) - Steal slot modifiers
    'zombie', 'zombie',             // 2x Zombie (2) - Consume: +3
    'vicious', 'vicious',       // 2x Berserker (4) - Heal & grow
    'vicious',                  // 1x Arms Peddler (5) - Dominant: create Spikes

    // Aggressive units
    'archer', 'archer',             // 2x Archer (3) - Deploy damage
    'turret',                       // 1x Turret (3) - Ping damage
    'strike',                       // 1x Hunter (4) - Kill wounded
    'strike',                      // 1x Vampire (2) - Drain & activate damage

    // Support units
    'scout', 'scout',               // 2x Scout (2) - Draw cards
    'engineer', 'engineer',           // 2x Acolyte (1) - Consume fodder
    'knight', 'knight',               // 2x Seed (1 slot bonus)

    // High power finishers
    'champion',                     // 1x Champion (5) - Pure stats
    'veteran',                      // 1x Veteran (4) - Pure stats

    // Actions (aggressive)
    'brawl', 'brawl',               // 2x Brawl (fight)
    'strike',                       // 1x Strike (3 damage)
    'fireball',                     // 1x Fireball
  ];

  const cards = createDeck(deckList, owner, engine);
  return shuffle(cards);
}

/**
 * Starter Deck 2: "Control Fortress" - Defensive positioning and slot manipulation
 */
export function createStarter2Deck(owner: PlayerId, engine: GameEngine): Card[] {
  const deckList = [
    // Defensive/control units
    'sentinel', 'sentinel',         // 2x Sentinel (2) - Block enemy deploy
    'armsPeddler', 'armsPeddler',         // 2x Engineer (1) - Slot buff each turn
    'priest',                       // 1x Priest (2) - Cleanse
    'roots', 'roots',               // 2x Roots (2) - Death: slot modifier

    // Positioning & tricks
    'ninja',                        // 1x Ninja (3) - Dodge & buff slot
    'rogue',                        // 1x Rogue (2) - Invert win condition
    'mimic',                        // 1x Mimic (1) - Copy power
    'knight',                       // 1x Knight (3) - Deploy Squire

    // Value generators
    'bard',                         // 1x Bard (2) - Buff close allies
    'noble',                        // 1x Noble (4) - Conquer: draw 2
    'wizard',                       // 1x Wizard (3) - Action synergy
    'apprentice',                   // 1x Apprentice (3) - Consume: draw

    // Card draw
    'scout', 'scout',               // 2x Scout (2) - Draw cards

    // High power
    'champion', 'champion',         // 2x Champion (5) - Pure stats
    'dragon',                       // 1x Dragon (7) - Must consume

    // Actions (utility)
    'seed', 'seed',                 // 2x Seed (slot buff)
    'energize',                     // 1x Energize (+3 to ally)
    'unsummon',                     // 1x Unsummon (bounce)
    'strike',                       // 1x Strike (3 damage)
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
