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
    
    if (this.card instanceof UnitCard && this.slotId !== undefined) {
      // Check if slot occupied
      const slot = state.slots[this.slotId];
      const existingUnit = slot.units[this.playerId];
      
      if (existingUnit) {
        // Enqueue sacrifice of existing unit
        this.card.engine.effectQueue.enqueue(
          new SacrificeUnitEffect(existingUnit)
        );
      }
      
      // Enqueue deploy
      this.card.engine.effectQueue.enqueue(
        new DeployUnitEffect(this.card, this.slotId)
      );
    } else if (this.card instanceof ActionCard) {
      // Actions play immediately
      this.card.play(this.slotId);
      player.discard.push(this.card);
    }
    
    return { newState: state, events };
  }
}
```

---

## DeployUnitEffect

### Purpose
Place a unit on the battlefield and trigger Deploy effects.

```typescript
class DeployUnitEffect extends Effect {
  constructor(
    private unit: UnitCard,
    private slotId: SlotId
  ) {
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
      slotId: this.slotId,
      playerId: this.unit.owner
    });
    
    // Trigger slot ongoing effects
    slot.ongoingEffects
      .filter(e => e.owner === this.unit.owner && e.trigger === 'deploy')
      .forEach(e => e.effect(this.unit));
    
    // Trigger unit's onDeploy
    this.unit.onDeploy();
    
    return { newState: state, events };
  }
}
```

---

## SacrificeUnitEffect

### Purpose
Remove a unit from play (replacement, consume, etc.) and trigger Death.

```typescript
class SacrificeUnitEffect extends Effect {
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
      type: 'UNIT_SACRIFICED',
      unitId: this.unit.id,
      slotId: this.unit.slotId!
    });
    
    events.push({
      type: 'UNIT_DIED',
      unitId: this.unit.id,
      slotId: this.unit.slotId!,
      cause: 'sacrifice'
    });
    
    // Trigger death effects
    this.unit.onDeath();
    
    return { newState: state, events };
  }
}
```

---

## ModifyPowerEffect

### Purpose
Change a unit's power (damage or buff).

```typescript
class ModifyPowerEffect extends Effect {
  constructor(
    private unit: UnitCard,
    private amount: number
  ) {
    super();
  }
  
  execute(state: GameState): EffectResult {
    // Unit.addPower() handles event emission
    this.unit.addPower(this.amount);
    
    return { newState: state, events: [] };
  }
}
```

**Note:** Unit.addPower() emits events internally, so no events returned here.

---

## DrawCardEffect

### Purpose
Draw cards from deck to hand.

```typescript
class DrawCardEffect extends Effect {
  constructor(
    private playerId: PlayerId,
    private count: number
  ) {
    super();
  }
  
  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];
    const player = state.players[this.playerId];
    
    for (let i = 0; i < this.count; i++) {
      if (player.deck.length === 0) break;
      
      const card = player.deck.pop()!;
      player.hand.push(card);
      
      events.push({
        type: 'CARD_DRAWN',
        playerId: this.playerId,
        cardId: card.cardId
      });
    }
    
    return { newState: state, events };
  }
}
```

---

## DealDamageEffect

### Purpose
Deal damage to a unit (reduces power, may cause death).

```typescript
class DealDamageEffect extends Effect {
  constructor(
    private unit: UnitCard,
    private amount: number
  ) {
    super();
  }
  
  execute(state: GameState): EffectResult {
    // Damage reduces power
    this.unit.dealDamage(this.amount);
    
    // State checker will handle death if power <= 0
    return { newState: state, events: [] };
  }
}
```

---

## BounceUnitEffect

### Purpose
Return a unit to owner's hand.

```typescript
class BounceUnitEffect extends Effect {
  constructor(private unit: UnitCard) {
    super();
  }
  
  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];
    const slot = state.slots[this.unit.slotId!];
    
    // Remove from slot
    slot.units[this.unit.owner] = null;
    
    // Add to hand
    const player = state.players[this.unit.owner];
    player.hand.push(this.unit);
    
    events.push({
      type: 'UNIT_BOUNCED',
      unitId: this.unit.id,
      slotId: this.unit.slotId!,
      toHand: true
    });
    
    return { newState: state, events };
  }
}
```

---

## DiscardCardEffect

### Purpose
Discard cards from hand to discard pile.

```typescript
class DiscardCardEffect extends Effect {
  constructor(
    private playerId: PlayerId,
    private count: number
  ) {
    super();
  }
  
  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];
    const player = state.players[this.playerId];
    
    for (let i = 0; i < this.count; i++) {
      if (player.hand.length === 0) break;
      
      const card = player.hand.pop()!;
      player.discard.push(card);
      
      events.push({
        type: 'CARD_DISCARDED',
        playerId: this.playerId,
        cardId: card.cardId
      });
    }
    
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

### Pattern 2: Enqueue Follow-up Effects

```typescript
class MyEffect extends Effect {
  execute(state: GameState): EffectResult {
    // Do something
    state.someValue = newValue;
    
    // Enqueue follow-up effect
    this.engine.effectQueue.enqueue(
      new AnotherEffect(params)
    );
    
    return { newState: state, events: [] };
  }
}
```

### Pattern 3: Conditional Effects

```typescript
class MyEffect extends Effect {
  execute(state: GameState): EffectResult {
    if (condition) {
      this.engine.effectQueue.enqueue(new EffectA());
    } else {
      this.engine.effectQueue.enqueue(new EffectB());
    }
    
    return { newState: state, events: [] };
  }
}
```

---

**See Also:**
- [EffectSystem.md](./EffectSystem.md) - Queue processing
- [CardSystem.md](./CardSystem.md) - Card-initiated effects
