# Engine Core

## Overview

The Game Engine is the central brain of the application. It manages the game state, processes actions, and enforces rules.

---

## GameEngine Class

### Responsibilities
1.  **State Management:** Holds the authoritative `GameState`.
2.  **Action Processing:** Receives `GameAction`s and converts them to effects.
3.  **Effect Resolution:** Manages the `EffectStack`.
4.  **Rule Enforcement:** Validates actions via `RuleManager`.
5.  **Event Emission:** Notifies the UI of all changes via `EventEmitter`.

---

## Game State

```typescript
interface GameState {
  players: [PlayerState, PlayerState];
  terrains: TerrainState[];
  leaders: [LeaderState, LeaderState]; // One per player
  currentSkirmish: number;
  currentPlayer: PlayerId;
  matchWinner: PlayerId | undefined;
  isDone: [boolean, boolean];           // Player locked out for skirmish
  hasActedThisTurn: [boolean, boolean]; // Did player take action this turn?
  tieSkirmishes: number;
}

interface LeaderState {
  leaderId: string;           // Which leader this player is using
  currentCharges: number;     // Remaining charges
  isExhausted: boolean;       // Cannot use ability this skirmish (future use)
}
```

### Turn State Fields

| Field | Purpose |
|-------|---------|
| `isDone` | When `true`, player cannot take any more actions this skirmish |
| `hasActedThisTurn` | Tracks if player performed PLAY_CARD or ACTIVATE this turn |

**Pass Logic:**
- If `hasActedThisTurn[playerId] === true` → Player ends turn, can act again later
- If `hasActedThisTurn[playerId] === false` → Player becomes Done (locked out)

---

## Action Processing Flow

### Main Processing Algorithm

```typescript
processAction(action: GameAction): GameState {
  // 1. Validate Action
  if (!this.isLegalAction(action)) {
    throw new Error('Illegal action');
  }

  // 2. Create primary effect
  const primaryEffect = this.actionToEffect(action);
  this.addInterrupt(primaryEffect); // Push to stack

  // 3. Process effect stack until empty
  while (!this.effectStack.isEmpty()) {
    const effect = this.effectStack.pop();

    // Execute effect
    const result = effect.execute(this.state);

    // Update state
    this.state = result.newState;

    // Emit events for UI
    result.events.forEach(e => this.emitEvent(e));

    // Check for triggered effects (add as interrupts)
    const triggered = this.checkTriggers(result.events);
    if (triggered.length > 0) this.addInterrupt(triggered[0]); // Simplified

    // Check state-based conditions
    const stateEffects = this.checkStateConditions();
    if (stateEffects.length > 0) {
        this.addSequence(stateEffects);
    }
  }

  // 4. Emit final state snapshot
  this.emitEvent({
    type: 'STATE_SNAPSHOT',
    state: this.state
  });

  return this.state;
}
```

---

## Action → State Transition Flow

**Step-by-Step Process:**

1.  **Player sends Action**
    *   UI dispatches action (e.g., PLAY_CARD)
    *   Action includes: playerId, cardId, slotId, targets

2.  **Engine validates Action**
    *   Check turn order
    *   Check card in hand
    *   Check slot validity
    *   Check targeting

3.  **Engine applies Action**
    *   Convert action to primary Effect
    *   Push primary Effect to Stack

4.  **Engine processes Effect Stack**
    *   Pop top effect
    *   Execute effect → update state
    *   Emit events for UI
    *   Check for triggered effects (push as interrupts)
    *   Repeat until stack empty

5.  **Engine checks state-based conditions**
    *   Check for deaths (power ≤ 0)
    *   Check for round end (both passed)
    *   Check for match end (2+ wins)
    *   Push effects as Sequence if needed

6.  **Repeat steps 4-5 until stack empty**

7.  **Engine emits Events**
    *   All intermediate events already emitted
    *   State Snapshot emitted at very end

---

## Leader System

### Overview

Each player has a **Leader** with a unique ability that can be activated using charges. Leader abilities are **Quick Actions** - they don't end the turn or pass priority.

### Leader Definition

```typescript
interface LeaderDefinition {
  leaderId: string;           // Unique identifier (e.g., "warlord", "sage")
  name: string;               // Display name
  maxCharges: number;         // Maximum charges (0 for no ability)
  abilityDescription: string; // Human-readable ability text
}
```

### Available Leaders

| Leader | Charges | Ability |
|--------|---------|---------|
| Rookie | 0 | No ability (default/blank leader) |
| Sage | 1 | Draw 1 card |
| Warlord | 2 | Deal 1 damage to an enemy unit |

### ACTIVATE_LEADER Action

```typescript
{
  type: 'ACTIVATE_LEADER';
  playerId: PlayerId;
  checksum?: string;
}
```

### Quick Action Behavior

When a player activates their leader ability:
1. Consume 1 charge
2. Execute the ability effect
3. **NO turn end** - player retains priority
4. **hasActedThisTurn is NOT set** - player can still perform other actions or pass

This allows chaining leader abilities with card plays:
- Use leader ability
- Play a card
- Pass turn

### Charge Reset

Charges are reset **per match** (not per skirmish). Once used, charges don't refill until the next game.

### File Structure

```
src/engine/leaders/
  Leader.ts           # Base LeaderAbility class
  LeaderRegistry.ts   # Leader definitions and factory
  abilities/
    SageAbility.ts    # Sage: Draw 1 card
    WarlordAbility.ts # Warlord: Deal 1 damage
    index.ts          # Exports
  index.ts            # Main exports
```

### Events

| Event | Description |
|-------|-------------|
| `LEADER_CHARGES_CHANGED` | Emitted when charges are consumed |
| `LEADER_ABILITY_ACTIVATED` | Emitted after ability executes |
