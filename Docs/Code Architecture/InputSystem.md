# Input System

## Purpose

Many cards and abilities require player input mid-execution (targeting units, modal choices, etc.). The input system pauses effect execution, requests player input via events, and resumes when input is provided.

**Examples Requiring Input:**
- Archer Deploy: "Deal 2 damage to a close enemy" → which enemy?
- Modal choices: "Choose one: Draw 2 cards OR Gain +2 power"
- Action cards: "Bounce a close unit" → which unit?
- Activate abilities: "Deal 3 damage to an enemy unit" → which enemy?

---

## Architecture Overview

### Async/Await Pattern

The input system uses **Promise-based suspension** to naturally pause effect execution:

```typescript
// In Archer's onDeploy:
async onDeploy(): Promise<void> {
  const closeEnemies = this.getCloseEnemies();

  if (closeEnemies.length === 0) return;

  // Pause execution until player selects target
  const targetId = await this.requestInput({
    type: 'target',
    targetType: 'enemy_unit',
    validTargetIds: closeEnemies.map(u => u.id),
    context: 'Archer Deploy ability'
  });

  // Resume execution with selected target
  const target = this.engine.getUnitById(targetId);
  if (target) {
    target.dealDamage(2);
  }
}
```

**Key Benefits:**
- Natural suspension via `await` - no explicit queue management
- Self-contained cards - they decide when to request input
- Type-safe Promise resolution
- Extensible for future input types

---

## Implementation Flow

```
1. Card effect calls await this.requestInput(request)
   ↓
2. requestInput() creates Promise, stores resolve function in engine
   ↓
3. Engine emits INPUT_REQUIRED event
   ↓
4. Effect queue is suspended (awaiting Promise)
   ↓
5. UI receives INPUT_REQUIRED event via gameStore
   ↓
6. UI highlights valid targets/choices
   ↓
7. Player clicks target/choice
   ↓
8. UI calls gameStore.submitInput(selection)
   ↓
9. gameStore calls engine.submitInput(selection)
   ↓
10. Engine resolves Promise with selection
   ↓
11. Card effect resumes execution
   ↓
12. Effect queue continues processing
```

---

## Core Types

### InputRequest (types.ts)

```typescript
export type InputRequest =
  | {
      type: 'target';
      targetType: 'unit' | 'enemy_unit' | 'ally_unit' | 'close_unit' | 'terrain';
      validTargetIds: string[];
      context: string;  // Description for UI
    }
  | {
      type: 'modal_choice';
      choices: string[];
      context: string;
    };
```

### INPUT_REQUIRED Event

```typescript
{
  type: 'INPUT_REQUIRED';
  playerId: PlayerId;
  inputRequest: InputRequest;
}
```

---

## Engine Implementation

### GameEngine Fields

```typescript
class GameEngine {
  // Stores Promise resolve function during input request
  public pendingInputResolve: ((input: any) => void) | null = null;

  // Called by UI to provide input
  submitInput(input: any): void {
    if (!this.pendingInputResolve) {
      throw new Error('No input request in progress');
    }

    // Resolve Promise, resume effect execution
    this.pendingInputResolve(input);
    this.pendingInputResolve = null;
  }
}
```

### Async Effect Queue

```typescript
private async processEffectQueue(): Promise<void> {
  while (this.effectQueue.length > 0) {
    const effect = this.effectQueue.dequeue();

    // Await effect execution - naturally suspends on input requests
    const result = await effect.execute(this.state);

    this.emitEvents(result.events);
    this.state = result.newState;
  }

  // Only emit STATE_SNAPSHOT if not awaiting input
  if (!this.pendingInputResolve) {
    this.emitEvent({
      type: 'STATE_SNAPSHOT',
      state: this.state
    });
  }
}
```

---

## Card Implementation

### requestInput() Helper (Card.ts)

```typescript
export abstract class UnitCard extends Card {
  protected requestInput(request: InputRequest): Promise<any> {
    return new Promise((resolve) => {
      // Store resolve function
      this.engine.pendingInputResolve = resolve;

      // Emit event to UI
      this.engine.emitEvent({
        type: 'INPUT_REQUIRED',
        playerId: this.owner,
        inputRequest: request,
      });
    });
  }
}
```

### Async Lifecycle Hooks

```typescript
export abstract class UnitCard extends Card {
  // All lifecycle hooks are async to support input requests
  async onDeploy(): Promise<void> {}
  async onDeath(): Promise<void> {}
  async onConquer(): Promise<void> {}
}
```

---

## Example Implementations

### Archer (Target Enemy Unit)

```typescript
export class Archer extends UnitCard {
  async onDeploy(): Promise<void> {
    const closeEnemies = this.getCloseEnemies();

    if (closeEnemies.length === 0) {
      return;  // No valid targets, skip
    }

    // Request player to select target
    const targetId = await this.requestInput({
      type: 'target',
      targetType: 'enemy_unit',
      validTargetIds: closeEnemies.map(u => u.id),
      context: 'Archer Deploy ability',
    });

    // Resume with selected target
    const target = this.engine.getUnitById(targetId);
    if (target) {
      target.dealDamage(2);
    }
  }
}
```

### Future: Modal Choice Example

```typescript
export class Mystic extends UnitCard {
  async onDeploy(): Promise<void> {
    // Request player choice
    const choice = await this.requestInput({
      type: 'modal_choice',
      choices: ['Draw 2 cards', 'Gain +2 power'],
      context: 'Mystic Deploy ability',
    });

    if (choice === 'Draw 2 cards') {
      this.engine.enqueueEffect(new DrawCardEffect(this.owner, 2));
    } else {
      this.addPower(2);
    }
  }
}
```

### Action Card with Targeting

```typescript
export class Strike extends ActionCard {
  async play(): Promise<void> {
    // Get all enemy units
    const enemies = this.engine.getAllUnits()
      .filter(u => u.owner !== this.owner);

    if (enemies.length === 0) return;

    // Request target
    const targetId = await this.requestInput({
      type: 'target',
      targetType: 'enemy_unit',
      validTargetIds: enemies.map(u => u.id),
      context: 'Strike action',
    });

    const target = this.engine.getUnitById(targetId);
    if (target) {
      target.dealDamage(3);
    }
  }
}
```

---

## UI Integration

### gameStore (State Management)

```typescript
interface GameStore {
  // Input request state
  pendingInputRequest: InputRequest | null;
  pendingInputPlayerId: PlayerId | null;

  // Methods
  submitInput: (input: any) => void;
  clearInputRequest: () => void;
}

// Event handler
engine.onEvent((event: GameEvent) => {
  if (event.type === 'INPUT_REQUIRED') {
    set({
      pendingInputRequest: event.inputRequest,
      pendingInputPlayerId: event.playerId,
    });
    return;
  }

  // ... other event handling
});
```

### GameBoard.tsx (UI Component)

```typescript
export const GameBoard: React.FC<GameBoardProps> = ({ gameState, localPlayerId }) => {
  const { pendingInputRequest, pendingInputPlayerId, submitInput } = useGameStore();

  // Check if we're waiting for local player input
  const isAwaitingInput = pendingInputRequest !== null &&
                          pendingInputPlayerId === localPlayerId;

  const handleUnitClick = (unitId: string) => {
    // Only handle clicks if awaiting targeting input
    if (!isAwaitingInput) return;
    if (!pendingInputRequest || pendingInputRequest.type !== 'target') return;

    // Validate target
    if (!pendingInputRequest.validTargetIds.includes(unitId)) return;

    // Submit target to engine
    submitInput(unitId);
  };

  // Render with isTargetable highlighting
  return (
    <Slot
      unit={unit}
      isTargetable={isAwaitingInput &&
                    pendingInputRequest?.type === 'target' &&
                    pendingInputRequest.validTargetIds.includes(unit.id)}
      onUnitClick={handleUnitClick}
    />
  );
};
```

---

## Key Design Decisions

### Why Async/Await?

✅ **Natural suspension** - `await` automatically pauses execution
✅ **No explicit queue state** - Promise handles suspension
✅ **Type-safe** - TypeScript enforces Promise<T> return types
✅ **Readable** - Linear code flow, easy to understand
✅ **Extensible** - Easy to add new input types

### Why Not External Effects?

❌ RequestTargetEffect + ExecuteTriggerEffect approach
- Scatters card logic across multiple files
- Harder to understand card behavior
- More complex to implement

✅ **Self-contained cards** decide when to request input
- All logic in one place
- Clear, linear flow
- Easy to add new cards with targeting

### Why Store Resolve in Engine?

The engine needs a way to route `submitInput()` to the correct Promise. Storing `pendingInputResolve` provides:
- Single source of truth for input state
- Prevents multiple concurrent input requests
- Type-safe resolution

---

## Testing Input Requests

### Manual Testing Flow

1. Deploy Archer adjacent to enemy unit
2. UI should highlight enemy unit (yellow border)
3. Click highlighted enemy
4. Enemy should take 2 damage
5. Game should continue normally

### Validation Checks

- ✅ Effect queue suspends during input request
- ✅ No STATE_SNAPSHOT emitted until input provided
- ✅ UI highlights only valid targets
- ✅ Invalid target clicks are ignored
- ✅ Game resumes after input
- ✅ Multiple targeting requests in sequence work

---

## Future Enhancements

### Potential Input Types

```typescript
| {
    type: 'number_select';
    min: number;
    max: number;
    context: string;
  }
| {
    type: 'card_select';
    validCardIds: string[];
    context: string;
  }
| {
    type: 'order_units';
    unitIds: string[];
    context: string;
  }
```

### AI Auto-Selection

AI players automatically select targets via the AIController:

```typescript
// AIController.ts
onEvent(event: GameEvent): void {
  // Handle INPUT_REQUIRED for target selection
  if (event.type === 'INPUT_REQUIRED' && event.playerId === this.playerId) {
    setTimeout(() => {
      const input = this.selectInput(event.inputRequest);
      if (input !== null) {
        this.engine.submitInput(input);
      }
    }, 500); // Short delay for visibility
  }
}

private selectInput(request: InputRequest): any {
  if (request.type === 'target') {
    // Simple strategy: pick first valid target/slot
    if (request.validSlots && request.validSlots.length > 0) {
      return request.validSlots[0];
    }
    if (request.validTargetIds && request.validTargetIds.length > 0) {
      return request.validTargetIds[0];
    }
  }
  
  if (request.type === 'choose_option' && request.options.length > 0) {
    return request.options[0];
  }
  
  return null;
}
```

This keeps card implementations clean - cards don't need to check player type.

---

**See Also:**
- [CardSystem.md](./CardSystem.md) - Card implementations with input requests
- [EffectSystem.md](./EffectSystem.md) - How async effects resolve
- [UIArchitecture.md](./UIArchitecture.md) - UI event handling
- [InteractionDesign.md](../UI Design/InteractionDesign.md) - UI targeting feedback
