import type { Card, PlayerId } from '../engine/types';
import type { GameEngine } from '../engine/GameEngine';
import { createDeck } from '../engine/cards';
import { shuffle } from './helpers';

/**
 * Create a V2 starter deck for testing
 */
export function createStarterDeck(owner: PlayerId, engine: GameEngine): Card[] {
  const deckList = [
    // Basic units
    'warrior', 'warrior', // 2x Warrior (2 power)
    'soldier', 'soldier', // 2x Soldier (4 power)

    // Deploy effect units
    'scout', 'scout', // 2x Scout (2 power, draw 1)
    'champion', 'champion', // 2x Champion (5 power, +2 on turn start)
    'vanguard', 'vanguard', // 2x Vanguard (2 power, close allies +1)
    'bulwark', // 1x Bulwark (4 power, enemy in front -2)
    'roots', // 1x Roots (2 power, slot bonus on death)
    'archer', 'archer', // 2x Archer (3 power, deal 2 to close enemy)
    'turret', // 1x Turret (3 power, 1 damage to front each turn)
    'hunter', // 1x Hunter (4 power, kill wounded close unit)

    // Consume mechanic
    'acolyte', 'acolyte', // 2x Acolyte (1 power, consumer +3)
    'transmuter', // 1x Transmuter (3 power, close allies +1 when consumed)

    // Actions
    'fireball', // 1x Fireball (6 damage to unit)
    'inspiration', // 1x Inspiration (ally +4)
    'study_the_battlefield', 'study_the_battlefield', // 2x Study (draw 2)
    'precision_strike', // 1x Precision Strike (kill <=3 power)
  ];

  // Total: 25 cards
  const cards = createDeck(deckList, owner, engine);

  // Shuffle the deck
  return shuffle(cards);
}

/**
 * Create a minimal test deck for quick testing
 */
export function createTestDeck(owner: PlayerId, engine: GameEngine): Card[] {
  const deckList = [
    'warrior', 'warrior',
    'scout', 'scout', 'scout',
    'champion', 'champion',
    'archer', 'archer',
    'study_the_battlefield',
  ];

  const cards = createDeck(deckList, owner, engine);
  return shuffle(cards);
}
