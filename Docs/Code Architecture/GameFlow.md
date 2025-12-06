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

      if (unit0 && unit1) {
        // Both players have units - compare power
        if (unit0.power > unit1.power) {
          state.players[0].vp += 1;
          slot.winner = 0;
        } else if (unit1.power > unit0.power) {
          state.players[1].vp += 1;
          slot.winner = 1;
        } else {
          // Tie - no VP awarded
          slot.winner = null;
        }
      } else if (unit0) {
        // Only player 0 has unit
        state.players[0].vp += 1;
        slot.winner = 0;
      } else if (unit1) {
        // Only player 1 has unit
        state.players[1].vp += 1;
        slot.winner = 1;
      } else {
        // Empty slot - no VP
        slot.winner = null;
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

  private checkMatchEnd(state: GameState): PlayerId | null | undefined {
    // 2 rounds won = victory
    if (state.roundsWon[0] >= 2) return 0;
    if (state.roundsWon[1] >= 2) return 1;

    // 1 win + 1 tie = victory
    if (state.roundsWon[0] === 1 && state.tieRounds >= 1) return 0;
    if (state.roundsWon[1] === 1 && state.tieRounds >= 1) return 1;

    // 2 ties = draw
    if (state.tieRounds >= 2) return null;

    // Continue playing
    return undefined;
  }

  private cleanupRound(state: GameState): void {
    // Move all units to discard (they don't "die", just cleanup)
    for (const slot of state.slots) {
      for (let playerId = 0; playerId < 2; playerId++) {
        const unit = slot.units[playerId];
        if (unit) {
          state.players[playerId].discard.push(unit);
          slot.units[playerId] = null;
        }
      }
      // Clear slot modifiers
      slot.modifiers = [0, 0];
    }

    // Reset pass flags
    state.hasPassed = [false, false];
  }
}
```

---

## Priority & Turn System

```typescript
class GameEngine {
  processAction(action: GameAction): GameState {
    if (action.type === 'PLAY_CARD') {
      // ... process card play ...

      // Switch priority to opponent
      this.state.currentPlayer = (1 - this.state.currentPlayer) as PlayerId;

      this.emitEvent({
        type: 'PRIORITY_CHANGED',
        newPriority: this.state.currentPlayer
      });
    }

    if (action.type === 'PASS') {
      // Lock player out
      this.state.hasPassed[action.playerId] = true;

      this.emitEvent({
        type: 'PLAYER_PASSED',
        playerId: action.playerId
      });

      // Check if both passed
      if (this.state.hasPassed[0] && this.state.hasPassed[1]) {
        // Enqueue round resolution
        this.effectQueue.enqueue(new ResolveRoundEffect());
      } else {
        // Switch priority to opponent (who can keep playing)
        this.state.currentPlayer = (1 - this.state.currentPlayer) as PlayerId;
      }
    }

    return this.state;
  }
}
```

---

## Power System

### Power Is Permanent

**No separate damage tracking:**

```typescript
class UnitCard extends Card {
  power: number;          // Current power
  originalPower: number;  // Base power (for healing)

  dealDamage(amount: number): void {
    this.power -= amount;
    if (this.power < 0) this.power = 0;

    this.engine.emitEvent({
      type: 'UNIT_DAMAGED',
      unitId: this.id,
      amount,
      newPower: this.power
    });
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
   ├─ Calculate slot winners
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
