import { CardInstance } from '@skirmish/card-maker';
import orderData from '../Data/order.json';
import { Card, UnitCard } from '@skirmish/engine';

// Use the "Normal" template ID from order.json as default
const DEFAULT_TEMPLATE_ID = '4c01f57f-4ace-4e7f-8e0e-a57aaf31efcd';

// Frame variant IDs from order.json
const FRAME_VARIANTS = {
    Purple: 'ef5ece3c-76ea-49dd-8b82-92abee658bfe',
    Red: '066b8f96-1d7a-463b-a5aa-48dd3146a1df',
    Order: 'ca14ff3b-f150-4a4b-ae46-36c834d18498' // Normal template frame
};

/**
 * Maps an Engine Card to a UI CardInstance.
 * 
 * Strategy:
 * 1. Check if the engine card ID directly matches a visual card ID (rare, as engine uses 'scout', 'archer').
 * 2. Check if the engine card NAME matches a visual card Name (more likely).
 * 3. Fallback: Create a generated CardInstance using engine data (Power, Text, etc.).
 */
export function hydrateCard(engineCard: Card | UnitCard): CardInstance {
    // 1. Try to find a matching visual definition in order.json
    // We search by Name first as it's more human-readable
    const visualMatch = orderData.cards.find(c => 
        c.data.name.toLowerCase() === engineCard.name.toLowerCase() ||
        c.id === engineCard.cardId // Less likely to match UUID vs 'scout'
    );

    if (visualMatch) {
        // Hydrate with runtime ID (the instance ID from engine)
        // But keep the visual data
        return {
            ...visualMatch,
            id: engineCard.id, // CRITICAL: Use the runtime instance ID (UUID) for React keys/state
        } as CardInstance;
    }

    // 2. Fallback: Generate generic card
    const isUnit = engineCard.getType() === 'unit';
    const unitCard = isUnit ? (engineCard as UnitCard) : null;

    // Helper to determine color based on... anything? Random? Or Owner?
    // For now default to 'Purple'
    const color = 'Purple'; 
    const frameVariantId = FRAME_VARIANTS.Purple;

    return {
        id: engineCard.id, // Runtime ID
        templateId: DEFAULT_TEMPLATE_ID,
        frameVariantId: frameVariantId,
        data: {
            name: engineCard.name,
            color: color,
            rarity: 'Bronze', // Default
            power: unitCard ? unitCard.power.toString() : '',
            text: `<p>${engineCard.description || ''}</p>`,
            type: isUnit ? 'Unit' : 'Action',
            notes: '',
            keywords: ''
        },
        artConfig: {
            // Use a placeholder or empty
            imageUrl: '', 
            x: 50,
            y: 50,
            scale: 1,
            isMask: false,
            maskX: 0,
            maskY: 0,
            maskWidth: 750,
            maskHeight: 1050
        }
    };
}

/**
 * Hydrates an entire hand of engine cards.
 */
export function hydrateHand(engineCards: (Card | UnitCard)[]): CardInstance[] {
    return engineCards.map(hydrateCard);
}
