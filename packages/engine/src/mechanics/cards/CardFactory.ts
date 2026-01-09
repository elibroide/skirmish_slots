import { UnitCard } from './Card';
import type { PlayerId } from '../../core/types';
import type { GameEngine } from '../../core/GameEngine';
import { createTrait, type TraitDefinition } from '../core/TraitFactory';
import { integratedCards } from '../../data/cards/index';

// Local definition interface
export interface UnitCardDefinition {
  name: string;
  description: string;
  basePower: number;
  traits: TraitDefinition[];
  rarity: 'Bronze' | 'Silver' | 'Gold';
  color: 'Red' | 'Purple' | 'Green' | 'Blue' | 'Yellow'; // Expanded colors from JSON
  unitType: string;
}

// Build definitions map
const DEFINITIONS: Record<string, UnitCardDefinition> = {};

(integratedCards as any[]).forEach((cardEntry: any) => {
    const data = cardEntry.data;
    const id = cardEntry.id; // Correct slug ID from JSON
    
    DEFINITIONS[id] = {
        name: data.name,
        description: data.text || '',
        basePower: parseInt(data.power) || 0,
        rarity: data.rarity as any || 'Bronze',
        color: data.color as any || 'Red',
        unitType: data.unitType || data.type || '', // Prefer data.unitType
        traits: data.traits || [] 
    };
});

export type UnitCardId = string;

/**
 * Factory function to create unit cards from data definitions
 */
export function createUnitCard(
  cardId: UnitCardId,
  owner: PlayerId,
  engine: GameEngine
): UnitCard {
  const def = DEFINITIONS[cardId];

  if (!def) {
    throw new Error(`Unknown unit card ID: ${cardId}. Available: ${Object.keys(DEFINITIONS).join(', ')}`);
  }

  // Create base unit card
  const card = new UnitCard(
    cardId,
    def.name,
    def.description,
    def.basePower,
    owner,
    engine
  );

  // Attach all traits to the card
  for (const traitDef of def.traits) {
    const trait = createTrait(traitDef, card, engine);
    card.addTrait(trait);
  }

  // Assign metadata
  card.rarity = def.rarity as any;
  card.color = def.color as any;
  card.unitType = def.unitType;

  return card;
}


