# Effect Classes

## Purpose

Effect Classes encapsulate game actions as objects that can be queued and executed. Each effect is responsible for one atomic state change.

---

## Base Effect Class

```typescript
abstract class Effect {
  abstract execute(state: GameState): EffectResult;
}

interface EffectResult {
  newState: GameState;
  events: GameEvent[];
}
```

**Key Points:**
- Effects are pure functions of state
- They return new state + events
- They don't emit events directly (engine does that)

---

## PlayCardEffect

### Purpose
Convert "play card" action into concrete effects (deploy or resolve action).

```typescript
class PlayCardEffect extends Effect {
  constructor(
    private playerId: PlayerId,
    private card: Card,
    private slotId?: SlotId
  ) {
    super();
  }
  
  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];
    
    // Remove from hand
    const player = state.players[this.playerId];
    player.hand = player.hand.filter(c => c.id !== this.card.id);
    
    events.push({
      type: 'CARD_PLAYED',
      playerId: this.playerId,
      cardId: this.card.cardId,
      slotId: this.slotId
    });
    
    // SEQUENCE: Define what happens in order
    const sequence: Effect[] = [];

    if (this.card instanceof UnitCard && this.slotId !== undefined) {
      // Check if slot occupied
      const slot = state.slots[this.slotId];
      const existingUnit = slot.units[this.playerId];
      
      if (existingUnit) {
        // Enqueue sacrifice of existing unit (Happens first)
        sequence.push(new SacrificeUnitEffect(existingUnit));
      }
      
      // Enqueue deploy (Happens second)
      sequence.push(new DeployUnitEffect(this.card, this.slotId));

    } else if (this.card instanceof ActionCard) {
      // Actions play immediately
      this.card.play(this.slotId);
      player.discard.push(this.card);
    }
    
    // Add sequence to stack
    this.card.engine.addSequence(sequence);

    return { newState: state, events };
  }
}
```

---

## DeployUnitEffect

### Purpose
Place a unit on the battlefield and trigger Deploy effects.

### Implementation

```typescript
class DeployUnitEffect extends Effect {
  constructor(private unit: UnitCard, private slotId: SlotId) {
    super();
  }
  
  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];
    const slot = state.slots[this.slotId];
    
    // Place unit
    slot.units[this.unit.owner] = this.unit;
    this.unit.slotId = this.slotId;
    
    events.push({
      type: 'UNIT_DEPLOYED',
      unitId: this.unit.id,
      slotId: this.slotId
    });
    
    // Trigger onDeploy (might add triggers to stack)
    this.unit.onDeploy();
    
    return { newState: state, events };
  }
}
```

---

## DeathEffect

### Purpose
Handle unit death from state-based checks.

```typescript
class DeathEffect extends Effect {
  constructor(private unit: UnitCard) {
    super();
  }
  
  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];
    const slot = state.slots[this.unit.slotId!];
    
    // Remove from slot
    slot.units[this.unit.owner] = null;
    
    // Add to discard
    const player = state.players[this.unit.owner];
    player.discard.push(this.unit);
    
    events.push({
      type: 'UNIT_DIED',
      unitId: this.unit.id,
      slotId: this.unit.slotId!,
      cause: 'death'
    });
    
    // Trigger death effects
    this.unit.onDeath();
    
    return { newState: state, events };
  }
}
```

---

## Effect Execution Patterns

### Pattern 1: State Change + Event

```typescript
class MyEffect extends Effect {
  execute(state: GameState): EffectResult {
    // 1. Modify state
    state.someValue = newValue;
    
    // 2. Create event
    const events = [{
      type: 'SOMETHING_HAPPENED',
      data: newValue
    }];
    
    // 3. Return both
    return { newState: state, events };
  }
}
```

### Pattern 2: Enqueue Follow-up Effects (Sequences)

```typescript
class MyEffect extends Effect {
  execute(state: GameState): EffectResult {
    // Do something
    state.someValue = newValue;
    
    // Enqueue follow-up effect (will happen AFTER this one finishes)
    this.engine.addSequence([
      new AnotherEffect(params)
    ]);
    
    return { newState: state, events: [] };
  }
}
```

### Pattern 3: Conditional Effects (Interrupts)

```typescript
class MyEffect extends Effect {
  execute(state: GameState): EffectResult {
    if (condition) {
      // Happens IMMEDIATELY next
      this.engine.addInterrupt(new EffectA());
    } else {
      this.engine.addInterrupt(new EffectB());
    }
    
    return { newState: state, events: [] };
  }
}
```

---

**See Also:**
- [EffectSystem.md](./EffectSystem.md) - Stack processing
- [CardSystem.md](./CardSystem.md) - Card-initiated effects
