# Targeting System

## Purpose

Many cards require the player to select a target (unit, slot, etc.) before the effect can resolve.

**Examples That Need Targeting:**
- "Deal 3 damage to an enemy" → which enemy?
- "Bounce a close unit" → which close unit?
- "Give a slot +2 power ongoing" → which slot?

---

## Implementation Flow

### Two-Phase Play

```typescript
// Phase 1: Card Selection
player clicks card in hand
→ UI highlights valid targets
→ player clicks target
→ UI sends action with target info

// Phase 2: Effect Resolution
engine processes action with target
→ effect executes on specified target
→ events emitted
```

---

## Action Structure with Targets

```typescript
type GameAction =
  | { 
      type: 'PLAY_CARD';
      playerId: PlayerId;
      cardId: string;
      slotId?: SlotId;          // For unit cards
      targetUnitId?: string;    // For effects targeting units
      targetSlotId?: SlotId;    // For effects targeting slots
    }
  | { type: 'PASS'; playerId: PlayerId };
```

---

## Card Targeting Requirements

```typescript
abstract class Card {
  // Override in cards that need targets
  needsTarget(): boolean {
    return false;  // Most cards don't need targets
  }
  
  getValidTargets(state: GameState): TargetInfo {
    return { type: 'none' };
  }
}

type TargetInfo =
  | { type: 'none' }
  | { type: 'unit'; validUnitIds: string[] }
  | { type: 'slot'; validSlotIds: SlotId[] }
  | { type: 'enemy_unit'; validUnitIds: string[] }
  | { type: 'ally_unit'; validUnitIds: string[] };
```

---

## Example: Fireball (Damage Spell)

```typescript
class Fireball extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super();
    this.cardId = 'fireball';
    this.name = 'Fireball';
    this.owner = owner;
    this.engine = engine;
  }
  
  needsTarget(): boolean {
    return true;
  }
  
  getValidTargets(state: GameState): TargetInfo {
    // Can target any slot
    return { type: 'slot', validSlotIds: [0, 1, 2, 3, 4] };
  }
  
  play(slotId: SlotId): void {
    const slot = this.engine.state.slots[slotId];
    
    // Damage unit on slot
    for (const unit of slot.units) {
      if (unit) unit.dealDamage(2);
    }
    
    // Damage close units
    const closeSlots = this.engine.getCloseSlots(slotId);
    for (const closeSlotId of closeSlots) {
      const closeSlot = this.engine.state.slots[closeSlotId];
      for (const unit of closeSlot.units) {
        if (unit) unit.dealDamage(2);
      }
    }
  }
}
```

---

## UI Flow

```typescript
// In React component
function Hand({ cards, onCardPlay }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [validTargets, setValidTargets] = useState(null);
  
  const handleCardClick = (card) => {
    if (card.needsTarget()) {
      // Enter targeting mode
      setSelectedCard(card);
      const targets = card.getValidTargets(gameState);
      setValidTargets(targets);
      // UI highlights valid targets
    } else {
      // Play immediately (no target needed)
      onCardPlay(card.id);
    }
  };
  
  const handleTargetClick = (targetId) => {
    // Play card with target
    onCardPlay(selectedCard.id, { targetUnitId: targetId });
    setSelectedCard(null);
    setValidTargets(null);
  };
  
  return (
    <div>
      {cards.map(card => (
        <Card 
          key={card.id}
          card={card}
          onClick={() => handleCardClick(card)}
          selected={selectedCard?.id === card.id}
        />
      ))}
    </div>
  );
}
```

---

## Validation

```typescript
class GameEngine {
  processAction(action: GameAction): GameState {
    if (action.type === 'PLAY_CARD') {
      const card = this.getCardById(action.cardId);
      
      // Validate target if needed
      if (card.needsTarget()) {
        const validTargets = card.getValidTargets(this.state);
        const providedTarget = action.targetUnitId || action.targetSlotId;
        
        if (!providedTarget) {
          throw new Error('Card requires target');
        }
        
        if (!this.isValidTarget(providedTarget, validTargets)) {
          throw new Error('Invalid target');
        }
      }
      
      // ... continue processing
    }
  }
}
```

---

## Auto-Target Fallback (for AI)

```typescript
class Card {
  selectDefaultTarget(state: GameState): string | SlotId | null {
    const targets = this.getValidTargets(state);
    
    if (targets.type === 'enemy_unit' && targets.validUnitIds.length > 0) {
      // Pick first valid target
      return targets.validUnitIds[0];
    }
    
    if (targets.type === 'slot' && targets.validSlotIds.length > 0) {
      return targets.validSlotIds[0];
    }
    
    return null;
  }
}

// AI uses this for simplicity
const target = card.selectDefaultTarget(state);
const action = {
  type: 'PLAY_CARD',
  cardId: card.id,
  targetUnitId: target
};
```

---

**See Also:**
- [CardSystem.md](./CardSystem.md) - Card implementations with targeting
- [UIArchitecture.md](./UIArchitecture.md) - UI handling of targeting
