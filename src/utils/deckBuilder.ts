import type { PlayerId } from '../engine/types';
import type { GameEngine } from '../engine/GameEngine';
import type { Card } from '../engine/cards/Card';
import { createDeck } from '../engine/cards';
import { shuffle } from './helpers';

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
    'rookie',                        // 1x Roots (Death buff)
    'wizard',                       // 1x Wizard (Action synergy)
    'archer', 'archer',             // 2x Archer (Deploy damage)
    'turret',                       // 1x Turret (Ping damage)
    'rookie',                       // 1x Rookie (Activate buff)
    'sentinel',                     // 1x Sentinel (Block enemy)
    
    // High Power Units (5 cards)
    'champion', 'champion',         // 2x Champion (Pure stats)
    'hunter',                       // 1x Hunter (Kill wounded)
    'noble',                        // 1x Noble (Conquer draw)
    'ranger',                       // 1x Ranger (Reposition)
    
    // Actions (5 cards)
    'strike', 'strike',             // 2x Strike (Direct damage)
    'unsummon',                     // 1x Unsummon (Bounce)
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
