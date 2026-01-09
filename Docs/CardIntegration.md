# 🃏 Card Integration Guide

This guide describes how to add and configure cards using the **Data-Driven Architecture**.

## 1. Overview

Cards are no longer defined in TypeScript code (`cardDefinitions.ts` is deleted).
Instead, all card data is loaded from a central JSON file:

> **Source**: `packages/engine/src/data/cards.json`

The `CardFactory` reads this file at runtime to generate `UnitCard` instances.

## 2. Adding a New Card

To add a new card:

1.  Open `packages/engine/src/data/cards.json`.
2.  Add a new entry to the `cards` array.
3.  Ensure the `data` object contains the required fields.

```json
{
  "id": "uuid-v4",
  "templateId": "...",
  "data": {
    "name": "My New Card",
    "color": "Red",
    "rarity": "Bronze",
    "power": "3",
    "type": "Unit // Soldier",
    "text": "<p>Deploy: Deal 2 damage.</p>",
    "traits": [ 
       // TRAITS DEFINITION HERE
    ]
  }
}
```

## 3. Defining Traits

The `traits` field is an array of `TraitDefinition` objects.
The schema for these objects is documented in full detail in:

> [Reaction System Architecture](file:///Users/littledonny/Games/skirmish_slots/Docs/TraitsArchitecture/ReactionTrait.md)

### Example: Deploy Trigger

```json
"traits": [
  {
    "type": "reaction",
    "config": {
      "triggers": [{ "type": "Deploy", "target": { "type": "Relative", "proximity": "Self" } }],
      "effects": [{
          "candidates": { "type": "Relative", "proximity": "Close", "relationship": "Enemy" }, 
          "selection": { "strategy": "Player" },
          "action": { "type": "DealDamage", "value": { "type": "static", "value": 2 } }
      }]
    }
  }
]
```

## 4. Testing Specific Cards

We now support specific integration tests for individual cards.

1.  Create a test file in: `packages/engine/src/__tests__/specificCardTests/`
2.  Name it `CardName.test.ts`.
3.  Use `createUnitCard('slug_name', ...)` to instantiate the card.
    *   **Slug Name**: Lowercase, spaces/special chars replaced by underscores (e.g., "Lone Jackal" -> "lone_jackal").

### Example Test

```typescript
import { createUnitCard } from '../../mechanics/cards/CardFactory';

describe('Card: Lone Jackal', () => {
    it('Triggers properly', async () => {
        const card = createUnitCard('lone_jackal', 0, engine);
        await card.deploy(0);
        // Assertions...
    });
});
```
