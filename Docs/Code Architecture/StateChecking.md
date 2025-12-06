# StateChecking.md
# State Checking

## Purpose

Automatically enforce game rules after each effect resolves.

**Key Insight:** Some game rules happen automatically based on state, not player actions.

---

## Checks Performed

### After Each Effect

1. **Unit Deaths:** Any unit with power ≤ 0 dies
2. **Round End:** Both players passed consecutively
3. **Win Conditions:** Player has 2+ rounds won

---

## Implementation

```typescript
class StateChecker {
  checkStateConditions(state: GameState): Effect[] {
    const effects: Effect[] = [];
    
    // Check deaths
    effects.push(...this.checkDeaths(state));
    
    // Check round end
    if (this.shouldEndRound(state)) {
      effects.push(new EndRoundEffect());
    }
    
    // Check match end
    if (this.shouldEndMatch(state)) {
      effects.push(new EndMatchEffect());
    }
    
    return effects;
  }
  
  private checkDeaths(state: GameState): Effect[] {
    const deathEffects: Effect[] = [];
    
    for (const slot of state.slots) {
      for (const unit of slot.units) {
        if (unit && unit.power <= 0) {
          deathEffects.push(new DeathEffect(unit));
        }
      }
    }
    
    return deathEffects;
  }
  
  private shouldEndRound(state: GameState): boolean {
    return state.hasPassed[0] && state.hasPassed[1];
  }
  
  private shouldEndMatch(state: GameState): boolean {
    return state.roundsWon[0] >= 2 || state.roundsWon[1] >= 2;
  }
}
```

---

## Integration with Effect Queue

**Called After Each Effect:**

```typescript
while (!this.effectQueue.isEmpty()) {
  const effect = this.effectQueue.dequeue();
  const result = effect.execute(this.state);
  
  this.state = result.newState;
  result.events.forEach(e => this.emitEvent(e));
  
  // Check state-based conditions
  const stateEffects = this.stateChecker.checkStateConditions(this.state);
  stateEffects.forEach(e => this.effectQueue.enqueue(e));
}
```

---

## Death Checking Details

### When Units Die

**Power ≤ 0:**
- Unit automatically dies
- DeathEffect enqueued
- onDeath() triggers

**Example:**
- Unit has 2 power
- Takes 3 damage → power = -1 (becomes 0)
- State checker sees power ≤ 0
- Enqueues DeathEffect
- Unit's onDeath() triggers

---

## Round End Checking

### Both Players Passed

**Condition:** `hasPassed[0] && hasPassed[1]`

**Action:**
- Enqueue EndRoundEffect
- Triggers skirmish resolution

---

## Match End Checking

### Win Conditions

**Standard Win:** `roundsWon[0] >= 2 || roundsWon[1] >= 2`

**Draw:** Both reach 2 via ties

**Action:**
- Enqueue EndMatchEffect
- Game over

---

**See Also:**
- [EffectSystem.md](./EffectSystem.md) - Integration with effect queue
- [EngineCore.md](./EngineCore.md) - State checking in action processing
