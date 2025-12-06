import type { Card, PlayerId } from '../types';
import type { GameEngine } from '../GameEngine';

// Import V2 unit cards
import { Warrior } from './units/Warrior';
import { Soldier } from './units/Soldier';
import { Scout } from './units/Scout';
import { Champion } from './units/Champion';
import { Vanguard } from './units/Vanguard';
import { Bulwark } from './units/Bulwark';
import { Roots } from './units/Roots';
import { Archer } from './units/Archer';
import { Turret } from './units/Turret';
import { Hunter } from './units/Hunter';
import { Acolyte } from './units/Acolyte';
import { Apprentice } from './units/Apprentice';
import { Mimic } from './units/Mimic';
import { Necromancer } from './units/Necromancer';
import { Transmuter } from './units/Transmuter';
import { RitualSacrifice } from './units/RitualSacrifice';
import { BladedOrb } from './units/BladedOrb';
import { Commander } from './units/Commander';

// Import V2 action cards
import { Fireball } from './actions/Fireball';
import { Inspiration } from './actions/Inspiration';
import { StudyTheBattlefield } from './actions/StudyTheBattlefield';
import { PrecisionStrike } from './actions/PrecisionStrike';
import { TacticalRetreat } from './actions/TacticalRetreat';
import { BloodPact } from './actions/BloodPact';
import { DesperateMeasures } from './actions/DesperateMeasures';

/**
 * Card registry - maps card IDs to their constructors
 * All V2 cards (18 units + 7 actions) implemented!
 */
type CardFactory = (owner: PlayerId, engine: GameEngine) => Card;

const CardRegistry: Record<string, CardFactory> = {
  // Basic units
  warrior: (owner, engine) => new Warrior(owner, engine),
  soldier: (owner, engine) => new Soldier(owner, engine),

  // Deploy effect units
  scout: (owner, engine) => new Scout(owner, engine),
  champion: (owner, engine) => new Champion(owner, engine),
  vanguard: (owner, engine) => new Vanguard(owner, engine),
  bulwark: (owner, engine) => new Bulwark(owner, engine),
  roots: (owner, engine) => new Roots(owner, engine),
  archer: (owner, engine) => new Archer(owner, engine),
  turret: (owner, engine) => new Turret(owner, engine),
  hunter: (owner, engine) => new Hunter(owner, engine),
  mimic: (owner, engine) => new Mimic(owner, engine),
  bladed_orb: (owner, engine) => new BladedOrb(owner, engine),
  commander: (owner, engine) => new Commander(owner, engine),

  // Consume mechanic units
  acolyte: (owner, engine) => new Acolyte(owner, engine),
  transmuter: (owner, engine) => new Transmuter(owner, engine),

  // Activate mechanic units
  apprentice: (owner, engine) => new Apprentice(owner, engine),
  necromancer: (owner, engine) => new Necromancer(owner, engine),
  ritual_sacrifice: (owner, engine) => new RitualSacrifice(owner, engine),

  // Action cards
  fireball: (owner, engine) => new Fireball(owner, engine),
  inspiration: (owner, engine) => new Inspiration(owner, engine),
  study_the_battlefield: (owner, engine) => new StudyTheBattlefield(owner, engine),
  precision_strike: (owner, engine) => new PrecisionStrike(owner, engine),
  tactical_retreat: (owner, engine) => new TacticalRetreat(owner, engine),
  blood_pact: (owner, engine) => new BloodPact(owner, engine),
  desperate_measures: (owner, engine) => new DesperateMeasures(owner, engine),
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
