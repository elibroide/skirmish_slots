# Effect System

## Purpose

The Effect System handles sequences of effects that may trigger other effects. This is the core resolution mechanism for all game actions.

**Key Insight:** Effects can chain and trigger other effects, requiring careful ordering and resolution.

---

## Effect Queue Structure (FIFO)

### Why Queue, Not Stack?

**Queue (FIFO - First In, First Out):**
```
Effect Queue:
┌─────────────────────────────┐
│ Effect 1: Deploy Scout      │ ← Process first
├─────────────────────────────┤
│ Effect 2: Draw 1 card       │ ← Process second
├─────────────────────────────┤
│ Effect 3: Unit deployed     │ ← Process third
└─────────────────────────────┘
```

**Benefits of FIFO:**
- ✅ More intuitive: effects resolve in play order
- ✅ Easier to understand for players
- ✅ Simpler to implement
- ✅ Matches Hearthstone's PowerTask system

**Alternative (Stack/LIFO):**
- Would be more Magic-like
- More complex mental model
- Effects resolve in reverse order

**Decision:** Queue (FIFO) for simplicity and player intuition

---

## Processing Algorithm

### Core Loop

```typescript
class EffectQueue {
  private queue: Effect[] = [];

  enqueue(effect: Effect): void {
    this.queue.push(effect);
  }

  dequeue(): Effect | null {
    return this.queue.shift() || null;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }
}
```

### Integration with Engine

```typescript
processAction(action: GameAction) {
  // Validate
  if (!this.isLegalAction(action)) {
    throw new Error('Illegal action');
  }
  
  // Create primary effect
  const primaryEffect = this.actionToEffect(action);
  this.effectQueue.enqueue(primaryEffect);
  
  // Process queue until empty
  while (!this.effectQueue.isEmpty()) {
    const effect = this.effectQueue.dequeue();
    
    // Execute effect
    const result = effect.execute(this.state);
    
    // Update state
    this.state = result.newState;
    
    // Emit events for UI
    result.events.forEach(e => this.emitEvent(e));
    
    // Check for triggered effects
    const triggered = this.checkTriggers(result.events);
    triggered.forEach(e => this.effectQueue.enqueue(e));
    
    // Check state-based conditions
    const stateEffects = this.checkStateConditions();
    stateEffects.forEach(e => this.effectQueue.enqueue(e));
  }
  
  return this.state;
}
```

---

## Effect Chaining Example

### Simple Chain: Scout Deploy

**User Action:** Play Scout to slot 1

**Queue Processing:**

```
Initial Queue:
[PlayCardEffect(Scout, slot 1)]

Step 1: Process PlayCardEffect
- Remove Scout from hand
- Enqueue: DeployUnitEffect(Scout, slot 1)

Queue: [DeployUnitEffect(Scout, slot 1)]

Step 2: Process DeployUnitEffect
- Place Scout in slot 1
- Trigger Scout.onDeploy() → enqueues DrawCardEffect
- Emit: UNIT_DEPLOYED

Queue: [DrawCardEffect(player, 1)]

Step 3: Process DrawCardEffect
- Draw 1 card from deck to hand
- Emit: CARD_DRAWN

Queue: []

Step 4: Check state conditions
- No deaths, no round end
Queue: []

Done! ✓
```

---

## Complex Chain: Martyr Replacement

### Martyr Death Chain Walkthrough

**Scenario:**
- Martyr (2 power) at slot 1
- Scout (2 power) at slot 2
- Player plays Champion (5 power) to slot 1

**User Action:** Play Champion to slot 1 (where Martyr is)

**Queue Processing:**

```
Initial Queue:
[PlayCardEffect(Champion, slot 1)]

────────────────────────────────────
Step 1: Process PlayCardEffect(Champion, slot 1)
────────────────────────────────────
Actions:
- Remove Champion from hand
- Check slot 1: occupied by Martyr
- Enqueue: SacrificeUnitEffect(Martyr)
- Enqueue: DeployUnitEffect(Champion, slot 1)
- Emit: CARD_PLAYED

Queue:
[SacrificeUnitEffect(Martyr), DeployUnitEffect(Champion, slot 1)]

────────────────────────────────────
Step 2: Process SacrificeUnitEffect(Martyr)
────────────────────────────────────
Actions:
- Remove Martyr from slot 1
- Add Martyr to discard
- Emit: UNIT_SACRIFICED
- Emit: UNIT_DIED
- Trigger Martyr.onDeath():
  - Find close allies (Scout at slot 2)
  - For each: enqueue ModifyPowerEffect(Scout, +2)

Queue:
[DeployUnitEffect(Champion, slot 1), ModifyPowerEffect(Scout, +2)]

────────────────────────────────────
Step 3: Process DeployUnitEffect(Champion, slot 1)
────────────────────────────────────
Actions:
- Place Champion in slot 1
- Trigger Champion.onDeploy() (none)
- Emit: UNIT_DEPLOYED

Queue:
[ModifyPowerEffect(Scout, +2)]

────────────────────────────────────
Step 4: Process ModifyPowerEffect(Scout, +2)
────────────────────────────────────
Actions:
- Scout.power: 2 → 4
- Emit: UNIT_POWER_CHANGED (Scout, +2)

Queue: []

────────────────────────────────────
Step 5: Check State Conditions
────────────────────────────────────
- Check deaths: No units at 0 power
- Check round end: Not both passed
- Check win: No winner yet

Queue: []

Done! ✓

Final State:
- Slot 1: Champion (5 power)
- Slot 2: Scout (4 power) ← buffed by Martyr
- Martyr in discard
```

---

## Multiple Deaths Chain

### Ghoul + Multiple Deaths

**Scenario:**
- Ghoul (1 power) at slot 0
- Martyr (2 power) at slot 1
- Scout (2 power) at slot 2
- Archer (3 power) at slot 3
- Player plays Fireball targeting slot 1

**Fireball Effect:** "Deal 2 damage to unit on slot and close units"

**Queue Processing:**

```
Initial Queue:
[FireballEffect(slot 1)]

────────────────────────────────────
Step 1: Process FireballEffect(slot 1)
────────────────────────────────────
Actions:
- Damage unit at slot 1 (Martyr): 2 → 0
- Damage close units:
  - Ghoul at slot 0: 1 → -1 (becomes 0)
  - Scout at slot 2: 2 → 0
  - Archer at slot 3: 3 → 1
- Emit: UNIT_DAMAGED (Martyr, Ghoul, Scout, Archer)

Note: Ghoul's "when close unit dies" doesn't trigger yet!

Queue: []

────────────────────────────────────
Step 2: Check State Conditions → Deaths
────────────────────────────────────
Found units at 0 power:
- Martyr (slot 1)
- Ghoul (slot 0)
- Scout (slot 2)

Enqueue death effects:
[DeathEffect(Martyr), DeathEffect(Ghoul), DeathEffect(Scout)]

────────────────────────────────────
Step 3-5: Process Deaths
────────────────────────────────────
Each DeathEffect:
- Remove unit from board
- Trigger onDeath() if any
- Martyr: buff close allies (+2 to Archer)

Final State:
- Slot 0: Empty (Ghoul died)
- Slot 1: Empty (Martyr died)
- Slot 2: Empty (Scout died)
- Slot 3: Archer (3 power) ← survives

Note: Ghoul didn't trigger because it died simultaneously!
```

---

## Effect Queue Best Practices

### DO: Enqueue Effects

```typescript
// ✅ GOOD: Enqueue effects
class Scout extends UnitCard {
  onDeploy(): void {
    this.engine.effectQueue.enqueue(
      new DrawCardEffect(this.owner, 1)
    );
  }
}
```

### DON'T: Modify State Directly

```typescript
// ❌ BAD: Modify state directly
class Scout extends UnitCard {
  onDeploy(): void {
    const card = this.engine.state.players[this.owner].deck.pop();
    this.engine.state.players[this.owner].hand.push(card);
    // No events emitted! UI won't update!
  }
}
```

---

## Debugging Effect Chains

### Add Logging

```typescript
processAction(action: GameAction) {
  console.log('=== Processing Action ===');
  console.log('Action:', action);
  
  const primaryEffect = this.actionToEffect(action);
  this.effectQueue.enqueue(primaryEffect);
  
  let step = 0;
  while (!this.effectQueue.isEmpty()) {
    step++;
    console.log(`\n--- Step ${step} ---`);
    
    const effect = this.effectQueue.dequeue();
    console.log('Effect:', effect.constructor.name);
    
    const result = effect.execute(this.state);
    console.log('Events:', result.events.map(e => e.type));
    
    // ... rest of processing
  }
  
  console.log('\n=== Action Complete ===\n');
}
```

---

**See Also:**
- [EffectClasses.md](./EffectClasses.md) - Specific effect implementations
- [EngineCore.md](./EngineCore.md) - Engine integration
- [StateChecking.md](./StateChecking.md) - State-based checks
