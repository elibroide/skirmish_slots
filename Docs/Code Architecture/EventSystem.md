# Event System

## Event Types

Complete list of all events emitted by the game engine:

```typescript
type GameEvent =
  // Card events
  | { type: 'CARD_PLAYED'; playerId: PlayerId; cardId: string; slotId?: SlotId }
  | { type: 'CARD_DRAWN'; playerId: PlayerId; cardId: string }
  | { type: 'CARD_DISCARDED'; playerId: PlayerId; cardId: string }
  
  // Unit events
  | { type: 'UNIT_DEPLOYED'; unitId: string; slotId: SlotId; playerId: PlayerId }
  | { type: 'UNIT_DIED'; unitId: string; slotId: SlotId; cause: string }
  | { type: 'UNIT_SACRIFICED'; unitId: string; slotId: SlotId }
  | { type: 'UNIT_BOUNCED'; unitId: string; slotId: SlotId; toHand: boolean }
  | { type: 'UNIT_POWER_CHANGED'; unitId: string; slotId: SlotId; oldPower: number; newPower: number; amount: number }
  
  // Slot events
  | { type: 'SLOT_EFFECT_ADDED'; slotId: SlotId; effect: string }
  | { type: 'SLOT_EFFECT_REMOVED'; slotId: SlotId; effectId: string }
  
  // Round events
  | { type: 'ROUND_STARTED'; roundNumber: number }
  | { type: 'ROUND_ENDED'; roundNumber: number; winner: PlayerId | null }
  | { type: 'PLAYER_PASSED'; playerId: PlayerId }
  | { type: 'CONQUER_TRIGGERED'; unitId: string; slotId: SlotId }
  
  // Match events
  | { type: 'MATCH_ENDED'; winner: PlayerId }
  
  // State snapshot
  | { type: 'STATE_SNAPSHOT'; state: GameState };
```

---

## EventEmitter Implementation

```typescript
class EventEmitter {
  private listeners: Array<(event: GameEvent) => void> = [];
  
  subscribe(callback: (event: GameEvent) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  emit(event: GameEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }
}
```

---

## Usage in Engine

```typescript
class GameEngine {
  private eventEmitter = new EventEmitter();
  
  onEvent(callback: (event: GameEvent) => void): () => void {
    return this.eventEmitter.subscribe(callback);
  }
  
  emitEvent(event: GameEvent): void {
    this.eventEmitter.emit(event);
  }
  
  processAction(action: GameAction): GameState {
    // ... process action, emit events ...
    
    // Always emit state snapshot at end
    this.emitEvent({
      type: 'STATE_SNAPSHOT',
      state: this.state
    });
    
    return this.state;
  }
}
```

---

## Subscription Pattern

```typescript
// In UI component or store
const unsubscribe = engine.onEvent((event) => {
  switch (event.type) {
    case 'CARD_PLAYED':
      console.log('Card played:', event.cardId);
      break;
    
    case 'UNIT_DEPLOYED':
      console.log('Unit deployed at slot:', event.slotId);
      break;
    
    case 'STATE_SNAPSHOT':
      // Update UI state
      setState(event.state);
      break;
  }
});

// Clean up on unmount
return () => unsubscribe();
```

---

**See Also:**
- [UIArchitecture.md](./UIArchitecture.md) - UI event subscriptions
- [AnimationSystem.md](./AnimationSystem.md) - Event-to-animation mapping
