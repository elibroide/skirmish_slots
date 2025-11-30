import type { Card, PlayerId } from '../types';
import type { GameEngine } from '../GameEngine';
import { Champion } from './Champion';
import { Scout } from './Scout';
import { Martyr } from './Martyr';
import { ShockTrooper } from './ShockTrooper';
import { EliteGuard } from './EliteGuard';
import { Bouncer } from './Bouncer';
import { Fortify } from './Fortify';
import { StudyTheField } from './StudyTheField';

/**
 * Card registry - maps card IDs to their constructors
 */
type CardFactory = (owner: PlayerId, engine: GameEngine) => Card;

const CardRegistry: Record<string, CardFactory> = {
  champion: (owner, engine) => new Champion(owner, engine),
  scout: (owner, engine) => new Scout(owner, engine),
  martyr: (owner, engine) => new Martyr(owner, engine),
  shock_trooper: (owner, engine) => new ShockTrooper(owner, engine),
  elite_guard: (owner, engine) => new EliteGuard(owner, engine),
  bouncer: (owner, engine) => new Bouncer(owner, engine),
  fortify: (owner, engine) => new Fortify(owner, engine),
  study_the_field: (owner, engine) => new StudyTheField(owner, engine),
};

/**
 * Create a card instance by card ID
 */
export function createCard(cardId: string, owner: PlayerId, engine: GameEngine): Card {
  const factory = CardRegistry[cardId];
  if (!factory) {
    throw new Error(`Unknown card: ${cardId}`);
  }
  return factory(owner, engine);
}

/**
 * Get all available card IDs
 */
export function getAllCardIds(): string[] {
  return Object.keys(CardRegistry);
}

/**
 * Create a deck from card IDs
 */
export function createDeck(cardIds: string[], owner: PlayerId, engine: GameEngine): Card[] {
  return cardIds.map((cardId) => createCard(cardId, owner, engine));
}

// Export card classes for direct use if needed
export {
  Champion,
  Scout,
  Martyr,
  ShockTrooper,
  EliteGuard,
  Bouncer,
  Fortify,
  StudyTheField,
};
