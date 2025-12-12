# Game Flow

## Round Start Sequence

```typescript
class StartRoundEffect extends Effect {
  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];

    // Determine draw count
    const drawCount = state.currentRound === 1 ? 8 : 3;

    // Draw cards for both players
    for (let playerId = 0; playerId < 2; playerId++) {
      for (let i = 0; i < drawCount; i++) {
        this.engine.effectQueue.enqueue(
          new DrawCardEffect(playerId as PlayerId, 1)
        );
      }
    }

    // Reset pass flags
    state.hasPassed = [false, false];

    // Reset VP for this round
    state.players[0].vp = 0;
    state.players[1].vp = 0;

    // Determine starting player (random on round 1, alternates after)
    if (state.currentRound === 1) {
      state.currentPlayer = Math.random() < 0.5 ? 0 : 1;
    }
    // Priority stays with last player for subsequent rounds

    events.push({
      type: 'ROUND_STARTED',
      roundNumber: state.currentRound
    });

    return { newState: state, events };
  }
}
```

---

## Round Resolution Sequence

```typescript
class ResolveRoundEffect extends Effect {
  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];

    // STEP 1: Calculate slot winners
    for (let slotId = 0; slotId < 5; slotId++) {
      const slot = state.slots[slotId];
      const unit0 = slot.units[0];
      const unit1 = slot.units[1];

      // Calculate base winner logic
      let winner: PlayerId | null = null;
      if (unit0 && unit1) {
        if (unit0.power > unit1.power) winner = 0;
        else if (unit1.power > unit0.power) winner = 1;
      } else if (unit0) {
        winner = 0;
      } else if (unit1) {
        winner = 1;
      }

      // Check for Rule Overrides (e.g., Rogue: "Lowest power wins")
      // The RuleManager can alter the terrain winner based on special effects
      slot.winner = this.engine.ruleManager.evaluate(
        RuleType.DETERMINE_TERRAIN_WINNER,
        { terrainId: slotId, power0: unit0?.power || 0, power1: unit1?.power || 0 },
        winner
      );

      // Award VP
      if (slot.winner !== null) {
        state.players[slot.winner].vp += 1;
      }

      events.push({
        type: 'SLOT_RESOLVED',
        slotId,
        winner: slot.winner,
        unit0Power: unit0?.power || 0,
        unit1Power: unit1?.power || 0
      });
    }

    // STEP 2: Trigger Conquer effects (left to right)
    for (let slotId = 0; slotId < 5; slotId++) {
      const slot = state.slots[slotId];
      if (slot.winner !== null) {
        const winningUnit = slot.units[slot.winner];
        if (winningUnit) {
          events.push({
            type: 'CONQUER_TRIGGERED',
            unitId: winningUnit.id,
            slotId
          });

          // Execute onConquer
          winningUnit.onConquer();
        }
      }
    }

    // STEP 3: Determine round winner
    const vp0 = state.players[0].vp;
    const vp1 = state.players[1].vp;

    let roundWinner: PlayerId | null = null;

    if (vp0 > vp1) {
      roundWinner = 0;
      state.roundsWon[0] += 1;
    } else if (vp1 > vp0) {
      roundWinner = 1;
      state.roundsWon[1] += 1;
    } else {
      // Tie round
      state.tieRounds += 1;
    }

    events.push({
      type: 'ROUND_ENDED',
      roundNumber: state.currentRound,
      winner: roundWinner,
      vp: [vp0, vp1]
    });

    // STEP 4: Check match end conditions
    const matchWinner = this.checkMatchEnd(state);

    if (matchWinner !== undefined) {
      state.matchWinner = matchWinner;
      events.push({
        type: 'MATCH_ENDED',
        winner: matchWinner
      });
    } else {
      // STEP 5: Cleanup for next round
      this.cleanupRound(state);
      state.currentRound += 1;

      // Enqueue next round start
      this.engine.effectQueue.enqueue(new StartRoundEffect());
    }

    return { newState: state, events };
  }

  // ... rest of class
}
```

---

## Priority & Turn System (Manual Pass)

### Turn State Tracking

The game uses two key state fields to track player activity:
- **`isDone: [boolean, boolean]`** - Player is locked out for the skirmish
- **`hasActedThisTurn: [boolean, boolean]`** - Player took an action this turn

### How Pass Works

When a player clicks **Pass**:
1. **If `hasActedThisTurn` is `true`**: Player ends their turn but can act again later
2. **If `hasActedThisTurn` is `false`**: Player becomes "Done" (locked out for skirmish)

```typescript
case 'PASS': {
  // Check if player performed any action this turn
  const becomesDone = !this.state.hasActedThisTurn[action.playerId];

  if (becomesDone) {
    // No action taken - player is locked out for the skirmish
    this.state.isDone[action.playerId] = true;
  }

  await this.emitEvent({
    type: 'PLAYER_PASSED',
    playerId: action.playerId,
    isDone: becomesDone,  // UI can show "Pass" or "Done" based on this
  });

  this.addInterrupt(new TurnEndEffect());
  break;
}
```

### Turn End Effect

At turn end, if switching to opponent:
```typescript
if (!state.isDone[opponent]) {
  state.currentPlayer = opponent;
  state.hasActedThisTurn[opponent] = false; // Reset for their new turn
  // ... emit PRIORITY_CHANGED, queue TurnStartEffect
}
```

### Skirmish End Condition

Skirmish ends when **both players are Done**:
```typescript
if (state.isDone.every(done => done)) {
  this.engine.addInterrupt(new ResolveSkirmishEffect());
}
```

---

## Power System

### Power Is Permanent

**No separate damage tracking (Deprecated approach - Now uses Calculated Power):**

**Calculated Power System:**
- Unit power is calculated dynamically: `power = originalPower + buffs - damage + slotModifier`
- **Buffs:** Permanent increments from effects (e.g., "Give +1").
- **Damage:** Permanent decrements from attacks/effects.
- **Slot Modifiers:** Applied dynamically based on current slot. Moving a unit automatically updates this factor.

```typescript
class UnitCard extends Card {
  originalPower: number;
  buffs: number = 0;
  damage: number = 0;

  get power(): number {
    let p = this.originalPower + this.buffs - this.damage;
    // ... apply slot modifiers ...
    return Math.max(0, p);
  }

  dealDamage(amount: number): void {
    this.damage += amount;
    // ...
  }

  addPower(amount: number): void {
    this.power += amount;

    this.engine.emitEvent({
      type: 'UNIT_POWER_CHANGED',
      unitId: this.id,
      amount,
      newPower: this.power
    });
  }

  heal(amount: number): void {
    const oldPower = this.power;
    this.power = Math.min(this.power + amount, this.originalPower);
    const actualHealed = this.power - oldPower;

    if (actualHealed > 0) {
      this.engine.emitEvent({
        type: 'UNIT_HEALED',
        unitId: this.id,
        amount: actualHealed,
        newPower: this.power
      });
    }
  }
}
```

---

## Bounced Units Are Fresh Instances

**When bounced, unit returns to hand:**
- When replayed, it's a NEW card instance
- Fresh power (no damage memory)
- Fresh buffs (no buff memory)

---

## UI Display Rules

### Units on Battlefield
- Show **current power only** (not base)
- Damaged unit with 3/5 power shows as "3"
- Buffed unit with 7/5 power shows as "7"

### Cards in Hand
- Show **original power** as base stats
- "Champion - Power: 5"

### Slot Ongoing Effects
- Display as colored rectangles behind slots
- Show effect name
- Tooltip shows full effect text on hover
- Multiple effects stack vertically

---

## Turn Start Effects

```typescript
class TurnStartEffect extends Effect {
  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];
    const currentPlayer = state.currentPlayer;

    // Process turn start effects for current player's units
    for (const slot of state.slots) {
      const unit = slot.units[currentPlayer];
      if (unit) {
        // Reduce cooldowns
        if (unit.cooldown > 0) {
          unit.cooldown -= 1;
        }

        // Trigger "On your turn start" effects
        // (Bard, Engineer, Turret, etc.)
        unit.onTurnStart?.();
      }
    }

    return { newState: state, events };
  }
}
```

---

## Complete Game Loop

```
1. Game Initialization
   ↓
2. Round Start (Draw cards)
   ↓
3. Player 1 Turn
   ├─ Play card OR Activate OR Pass
   ├─ Process effects
   └─ Switch priority
   ↓
4. Player 2 Turn
   ├─ Play card OR Activate OR Pass
   ├─ Process effects
   └─ Switch priority
   ↓
5. Repeat 3-4 until both pass
   ↓
6. Round Resolution
   ├─ Calculate slot winners (Rule Manager overrides allowed)
   ├─ Count VP
   ├─ Trigger Conquer
   ├─ Determine round winner
   └─ Check match end
   ↓
7a. Match Continues → Go to step 2
7b. Match Ends → Game Over
```

---

**See Also:**
- [CoreRules.md](../Game%20Design/CoreRules.md) - Game rules being implemented
- [Gameplay.md](../Game%20Design/Gameplay.md) - Turn structure and resolution
- [EffectSystem.md](./EffectSystem.md) - Effect processing
