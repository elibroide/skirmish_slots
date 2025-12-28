import type { PlayerId } from '../../core/types';
import type { GameEngine } from '../../core/GameEngine';
import type { Card } from './Card';
import { createUnitCard } from './CardFactory';
export { createUnitCard };
import { UNIT_CARD_DEFINITIONS } from './cardDefinitions';
export { UNIT_CARD_DEFINITIONS };

// Actions (still class-based)
import { Assassinate } from './actions/Assassinate';
import { Brawl } from './actions/Brawl';
import { Energize } from './actions/Energize';
import { Fireball } from './actions/Fireball';
import { Repositioning } from './actions/Repositioning';
import { Seed } from './actions/Seed';
import { Spike } from './actions/Spike';
import { Strike } from './actions/Strike';
import { Unsummon } from './actions/Unsummon';

type CardFactory = (owner: PlayerId, engine: GameEngine) => Card;

const CardRegistry: Record<string, CardFactory> = {
  // Units - now using ECS factory
  ...Object.keys(UNIT_CARD_DEFINITIONS).reduce((acc, cardId) => {
    acc[cardId] = (owner, engine) => createUnitCard(cardId, owner, engine);
    return acc;
  }, {} as Record<string, CardFactory>),

  // Actions - still class-based
  assassinate: (owner, engine) => new Assassinate(owner, engine),
  brawl: (owner, engine) => new Brawl(owner, engine),
  energize: (owner, engine) => new Energize(owner, engine),
  fireball: (owner, engine) => new Fireball(owner, engine),
  repositioning: (owner, engine) => new Repositioning(owner, engine),
  seed: (owner, engine) => new Seed(owner, engine),
  spike: (owner, engine) => new Spike(owner, engine),
  strike: (owner, engine) => new Strike(owner, engine),
  unsummon: (owner, engine) => new Unsummon(owner, engine),
};

export function createCard(cardId: string, owner: PlayerId, engine: GameEngine): Card {
  const factory = CardRegistry[cardId];
  if (!factory) {
    throw new Error(`Unknown card: ${cardId}`);
  }
  return factory(owner, engine);
}

export function getAllCardIds(): string[] {
  return Object.keys(CardRegistry);
}

export function createDeck(cardIds: string[], owner: PlayerId, engine: GameEngine): Card[] {
  return cardIds.map((cardId) => createCard(cardId, owner, engine));
}
