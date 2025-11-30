import type { Card, PlayerId } from '../engine/types';
import type { GameEngine } from '../engine/GameEngine';
import { createDeck } from '../engine/cards';
import { shuffle } from './helpers';

/**
 * Create a basic starter deck for testing
 */
export function createStarterDeck(owner: PlayerId, engine: GameEngine): Card[] {
  const deckList = [
    // Units
    'champion', 'champion', 'champion', // 3x Champion (5 power)
    'shock_trooper', 'shock_trooper', 'shock_trooper', // 3x Shock Trooper (3 power, deal 1 to close enemies)
    'elite_guard', 'elite_guard', 'elite_guard', // 3x Elite Guard (4 power, +1 VP on conquer)
    'scout', 'scout', 'scout', 'scout', 'scout', // 5x Scout (1 power, draw 1)
    'martyr', 'martyr', 'martyr', // 3x Martyr (2 power, +2 to close allies on death)
    'bouncer', 'bouncer', // 2x Bouncer (2 power, bounce close unit)

    // Actions
    'study_the_field', 'study_the_field', // 2x Draw 2
    'fortify', 'fortify', 'fortify', // 3x Fortify (slot gets: deal 2 to close enemies on deploy)
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
    'champion', 'champion',
    'scout', 'scout', 'scout',
    'martyr', 'martyr',
    'shock_trooper', 'shock_trooper',
    'study_the_field',
  ];

  const cards = createDeck(deckList, owner, engine);
  return shuffle(cards);
}
