# Effect System

## Purpose

The Effect System handles sequences of effects that may trigger other effects. This is the core resolution mechanism for all game actions.

**Key Insight:** Effects can chain and trigger other effects, requiring careful ordering and resolution.

---

## Effect Stack Structure (LIFO)

### Why Stack (LIFO)?

**Stack (LIFO - Last In, First Out):**
```
Effect Stack:
┌─────────────────────────────┐
│ Effect 3: Death Trigger     │ ← Pops first (Highest Priority)
├─────────────────────────────┤
│ Effect 2: Unit Deployed     │ ← Pops second
├─────────────────────────────┤
│ Effect 1: End Turn          │ ← Pops last (Lowest Priority)
└─────────────────────────────┘
```

**Benefits of Stack:**
- ✅ **Correct Interrupts:** Death triggers happen *immediately* inside the action that caused them.
- ✅ **Nested Logic:** Triggers resolve before the original action "finishes" completely.
- ✅ **Standard Model:** Matches Magic: The Gathering's stack interaction.

---

## Processing Algorithm

### Core Loop

```typescript
class EffectStack {
  private stack: Effect[] = [];

  // Add high-priority interrupt (runs next)
  push(effect: Effect): void {
    this.stack.push(effect);
  }

  // Add sequence [A, B, C] -> Runs A, then B, then C
  pushSequence(effects: Effect[]): void {
    // Pushes in reverse so first element is on top
    for (let i = effects.length - 1; i >= 0; i--) {
      this.stack.push(effects[i]);
    }
  }

  pop(): Effect | undefined {
    return this.stack.pop();
  }
}
```

### Integration with Engine

```typescript
processAction(action: GameAction) {
  // Convert action to effect
  const primaryEffect = this.actionToEffect(action);
  this.addInterrupt(primaryEffect); // Push to stack
  
  // Process stack until empty
  while (!this.effectStack.isEmpty()) {
    const effect = this.effectStack.pop();
    
    // Execute effect
    const result = await effect.execute(this.state);
    
    // Update state & Emit events
    this.state = result.newState;
    result.events.forEach(e => this.emitEvent(e));
    
    // Check state-based conditions (Deaths)
    const stateEffects = this.stateChecker.checkStateConditions(this.state);
    
    // Push deaths as a sequence (Interrupts current flow)
    if (stateEffects.length > 0) {
      this.addSequence(stateEffects);
    }
  }
}
```

---

## Effect Chaining Example

### Play Card with Interrupts

**User Action:** Play Fireball (Damage 2)

**Stack Processing:**

1.  **Initial Stack:** `[PlayCardEffect]`
2.  **Pop PlayCardEffect:**
    *   Deals 2 Damage to Unit A (HP 2 -> 0).
    *   Adds `TurnStartEffect` to stack (Sequence: [TurnStart]).
    *   *Stack:* `[TurnStartEffect]`
3.  **State Check:**
    *   Finds Unit A is dead.
    *   Adds `DeathEffect(Unit A)` as interrupt.
    *   *Stack:* `[DeathEffect, TurnStartEffect]`
4.  **Pop DeathEffect:**
    *   Unit A dies.
    *   Triggers "On Death: Deal 1 Damage".
    *   Adds `TriggerEffect` to stack.
    *   *Stack:* `[TriggerEffect, TurnStartEffect]`
5.  **Pop TriggerEffect:**
    *   Deals 1 damage.
    *   *Stack:* `[TurnStartEffect]`
6.  **Pop TurnStartEffect:**
    *   Starts turn.
    *   *Stack:* `[]`
7.  **Done.**

---

## Inline Logic with `TriggerEffect`

To make abilities visible to the UI without creating separate classes for every card, use `TriggerEffect`.

```typescript
// Inside Card Class
async onDeath() {
  // Logic defined inline
  const logic = async (state) => {
    await this.engine.addSlotModifier(this.slotId, 1);
  };

  // Wrapped in TriggerEffect for UI visibility
  this.engine.addInterrupt(
    new TriggerEffect(this, "Death Trigger", logic)
  );
}
```

---

## Best Practices

### DO: Use `addSequence` for Flows
When an effect causes multiple things to happen in order (e.g., "Draw 2 cards"), use `addSequence`.

```typescript
// Draw 2 cards
const effects = [new DrawCardEffect(), new DrawCardEffect()];
this.engine.addSequence(effects);
```

### DO: Use `addInterrupt` for Reactions
When an ability triggers off something else, use `addInterrupt` so it happens immediately.

```typescript
// Counterspell logic
this.engine.addInterrupt(new CounterEffect());
```

---

**See Also:**
- [EffectClasses.md](./EffectClasses.md) - Specific effect implementations
- [EngineCore.md](./EngineCore.md) - Engine integration
- [StateChecking.md](./StateChecking.md) - State-based checks
