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
  players: { [id: number]: PlayerState };
  terrains: TerrainState[];
  currentSkirmish: number;
  currentPlayer: PlayerId;
  matchWinner: PlayerId | undefined;
  isDone: { [id: number]: boolean };
}
```

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
