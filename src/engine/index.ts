// Main export file for the game engine
export { GameEngine } from './GameEngine';
export { EventEmitter } from './EventEmitter';
export { EffectQueue } from './EffectQueue';
export { StateChecker } from './StateChecker';
export { createInitialGameState, getOpponent, getAdjacentSlots, getFarSlots } from './GameState';

// Export types
export type * from './types';

// Export cards
export * from './cards';
export { createCard, createDeck, getAllCardIds } from './cards';

// Export effects
export * from './effects';

// Utility to initialize a game
import { GameEngine } from './GameEngine';
import { createStarterDeck } from '../utils/deckBuilder';
import { StartRoundEffect } from './effects/StartRoundEffect';
import type { Card } from './types';

/**
 * Initialize a new game with two decks
 */
export function initializeGame(deck1?: Card[], deck2?: Card[]): GameEngine {
  // Create temporary engine for deck creation
  const tempEngine = new GameEngine([], []);

  // Create default decks if not provided
  const finalDeck1 = deck1 || createStarterDeck(0, tempEngine);
  const finalDeck2 = deck2 || createStarterDeck(1, tempEngine);

  // Create the actual game engine
  const engine = new GameEngine(finalDeck1, finalDeck2);

  // Start the first round
  engine.enqueueEffect(new StartRoundEffect());
  engine['processEffectQueue']();

  return engine;
}
