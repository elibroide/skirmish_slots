import { UnitCard } from './Card';
import { UNIT_CARD_DEFINITIONS } from './cardDefinitions';
import { createTrait } from '../core/TraitFactory';
/**
 * Factory function to create unit cards from data definitions
 */
export function createUnitCard(cardId, owner, engine) {
    const def = UNIT_CARD_DEFINITIONS[cardId];
    if (!def) {
        throw new Error(`Unknown unit card ID: ${cardId}`);
    }
    // Create base unit card
    const card = new UnitCard(cardId, def.name, def.description, def.basePower, owner, engine);
    // Attach all traits to the card
    for (const traitDef of def.traits) {
        const trait = createTrait(traitDef, card);
        card.addTrait(trait);
    }
    // Assign metadata
    card.rarity = def.rarity;
    card.color = def.color;
    card.unitType = def.unitType;
    return card;
}
