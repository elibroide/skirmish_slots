# UI Architecture

## Core Principles

### 1. UI = f(events)
The UI is a pure function of events emitted by the engine. Never access `engine.state` directly.

### 2. Store = State Container (Read-Only)
The store **only** receives events and updates UI state. It **never** issues commands to the engine.

### 3. Components = Command Issuers (Write-Only)
Components call `engine.submitAction()` and `engine.submitInput()` directly. No command methods in store.

---

## Separation of Concerns

### ✅ CORRECT Architecture

```typescript
// Store: State container only
interface GameStore {
  // State (built from events)
  gameState: GameState | null;
  eventLog: GameEvent[];
  pendingInputRequest: InputRequest | null;

  // Engine reference (for components to call)
  engine: GameEngine | null;

  // Initialization only
  initGame: (localPlayerId: PlayerId) => void;
}

// Components: Issue commands directly
function GameBoard() {
  const { gameState, engine, pendingInputRequest } = useGameStore();

  const handlePlayCard = (cardId: string, terrainId: TerrainId) => {
    // Component calls engine directly
    engine.submitAction({
      type: 'PLAY_CARD',
      playerId: localPlayerId,
      cardId,
      terrainId
    });
  };

  const handleTargetClick = (unitId: string) => {
    // Component calls engine directly
    engine.submitInput(unitId);
  };
}
```

### ❌ WRONG Architecture

```typescript
// Store: Has command methods (WRONG!)
interface GameStore {
  gameState: GameState | null;

  // ❌ Commands in store (violates separation)
  playCard: (cardId: string, terrainId: TerrainId) => void;
  submitInput: (input: any) => void;
}

// Store implementation
const useGameStore = create<GameStore>((set, get) => ({
  // ❌ Store issuing commands to engine
  playCard: (cardId, terrainId) => {
    const { engine } = get();
    engine.submitAction({ type: 'PLAY_CARD', ... });
  },

  // ❌ Store issuing commands to engine
  submitInput: (input) => {
    const { engine } = get();
    engine.submitInput(input);
  }
}));
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────┐
│           User Interaction                   │
│        (click, drag, input)                  │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│         Component Handler                    │
│   (handlePlayCard, handleTargetClick)        │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│      Direct Engine Command                   │
│  engine.submitAction() / submitInput()       │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│        Engine Processes                      │
│    (effects, state changes)                  │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│        Engine Emits Events                   │
│  (UNIT_DEPLOYED, INPUT_REQUIRED, etc.)       │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│       Store Event Listener                   │
│  engine.onEvent(event => { ... })            │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│      Store Updates State                     │
│  set({ gameState, pendingInputRequest })     │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│      Components Re-render                    │
│       (React to state changes)               │
└─────────────────────────────────────────────┘
```

---

## Store Implementation

### Correct Pattern

```typescript
import { create } from 'zustand';

interface GameStore {
  // UI State (built from events only)
  gameState: GameState | null;
  eventLog: GameEvent[];
  pendingInputRequest: InputRequest | null;
  pendingInputPlayerId: PlayerId | null;

  // Engine reference (for components to call)
  engine: GameEngine | null;

  // Initialization
  initGame: (localPlayerId: PlayerId) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  eventLog: [],
  pendingInputRequest: null,
  pendingInputPlayerId: null,
  engine: null,

  initGame: (localPlayerId: PlayerId) => {
    const engine = new GameEngine(controller0, controller1);

    // Subscribe to ALL engine events
    engine.onEvent((event: GameEvent) => {
      const currentState = get();
      const newEventLog = [...currentState.eventLog, event];

      // Handle INPUT_REQUIRED events
      if (event.type === 'INPUT_REQUIRED') {
        set({
          eventLog: newEventLog,
          pendingInputRequest: event.inputRequest,
          pendingInputPlayerId: event.playerId,
        });
        return;
      }

      // Update game state snapshot
      if (event.type === 'STATE_SNAPSHOT') {
        set({
          eventLog: newEventLog,
          gameState: event.state,
          // Clear input request when state updates (input was provided)
          pendingInputRequest: null,
          pendingInputPlayerId: null,
        });
      } else {
        set({ eventLog: newEventLog });
      }
    });

    set({ engine, gameState: engine.state });
  },
}));
```

**Key Points:**
- ✅ Store only has state fields and event listeners
- ✅ No command methods (`playCard`, `submitInput`, etc.)
- ✅ Components get `engine` from store and call it directly
- ✅ Store updates state when events arrive

---

## Component Patterns

### Playing a Card

```typescript
function GameBoard() {
  const { gameState, engine } = useGameStore();

  const handleSlotDrop = (terrainId: TerrainId, cardId: string) => {
    // Validate locally
    if (!isLocalPlayerTurn) return;

    // Call engine directly
    engine.submitAction({
      type: 'PLAY_CARD',
      playerId: localPlayerId,
      cardId,
      terrainId
    });
  };

  return (
    <Slot onDrop={(terrainId) => handleSlotDrop(terrainId, draggedCardId)} />
  );
}
```

### Submitting Input (Targeting)

```typescript
function GameBoard() {
  const { pendingInputRequest, engine } = useGameStore();
  const isAwaitingInput = pendingInputRequest !== null;

  const handleUnitClick = (unitId: string) => {
    // Only handle if awaiting input
    if (!isAwaitingInput) return;
    if (pendingInputRequest.type !== 'target') return;

    // Validate target
    if (!pendingInputRequest.validTargetIds.includes(unitId)) return;

    // Call engine directly
    engine.submitInput(unitId);
  };

  return (
    <Slot
      isTargetable={isAwaitingInput &&
                    pendingInputRequest?.validTargetIds.includes(unitId)}
      onUnitClick={handleUnitClick}
    />
  );
}
```

### Passing Turn

```typescript
function PlayerPanel() {
  const { engine } = useGameStore();

  const handlePass = () => {
    engine.submitAction({
      type: 'DONE',
      playerId: localPlayerId
    });
  };

  return <button onClick={handlePass}>Pass</button>;
}
```

---

## Why This Architecture?

### Separation of Concerns

**Store (Observer):**
- Listens to engine events
- Updates UI state based on events
- Pure state container
- No side effects

**Components (Commander):**
- Issue commands to engine
- Handle user interactions
- Validate input locally
- Direct communication with engine

**Engine (Processor):**
- Receives commands via `submitAction()` and `submitInput()`
- Processes game logic
- Emits events
- No knowledge of UI

### Benefits

✅ **Clear Responsibilities:** Each layer has one job
✅ **Easier Testing:** Store is pure state, components are testable
✅ **No Circular Dependencies:** Commands flow down, events flow up
✅ **Better Debugging:** Clear command/event separation
✅ **Prevents Anti-Patterns:** Store can't accidentally mutate engine state

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Store Commands

```typescript
// DON'T: Store issuing commands
interface GameStore {
  playCard: (cardId) => void;  // ❌
  submitInput: (input) => void;  // ❌
}
```

**Why Wrong:** Store becomes a middleman issuing commands. Violates separation of concerns.

**Fix:** Components call engine directly.

### ❌ Mistake 2: Direct State Access

```typescript
// DON'T: Accessing engine state directly
function MyComponent() {
  const { engine } = useGameStore();
  const unit = engine.state.terrains[0].slots[0].unit;  // ❌
}
```

**Why Wrong:** Bypasses event-driven architecture. Component won't re-render on state changes.

**Fix:** Read from `gameState` in store, which is updated via events.

### ❌ Mistake 3: State Mutation in Store

```typescript
// DON'T: Mutating state in store
engine.onEvent((event) => {
  if (event.type === 'INPUT_REQUIRED') {
    currentState.pendingInputRequest = event.inputRequest;  // ❌
  }
});
```

**Why Wrong:** Violates immutability. Zustand won't trigger re-renders.

**Fix:** Always use `set()` with new objects.

---

## Component Structure

```
App
├── GameSetup
│   └── (deck builder, player selection)
└── GameBoard
    ├── OpponentArea (top)
    │   ├── Hand (card backs)
    │   └── CharacterPanel
    ├── Battlefield (center)
    │   ├── Terrain (x5)
    │   │   ├── Slot (opponent)
    │   │   └── Slot (player)
    │   └── SkirmishTracker
    ├── PlayerArea (bottom)
    │   ├── CharacterPanel
    │   │   └── PassButton
    │   └── Hand (fanned cards)
    └── AnimationLayer (future)
```

---

## Event Subscription Pattern

```typescript
// Store subscribes once during initialization
initGame: (localPlayerId: PlayerId) => {
  const engine = new GameEngine(controller0, controller1);

  // Single event listener for all events
  engine.onEvent((event: GameEvent) => {
    // Route events to appropriate state updates
    switch (event.type) {
      case 'INPUT_REQUIRED':
        set({ pendingInputRequest: event.inputRequest });
        break;
      case 'STATE_SNAPSHOT':
        set({ gameState: event.state });
        break;
      // ... other events
    }
  });

  set({ engine });
}
```

**Key Points:**
- ✅ Single subscription in store initialization
- ✅ Components don't subscribe to engine directly
- ✅ Store acts as event aggregator
- ✅ Clean unsubscribe on unmount

---

**See Also:**
- [EventSystem.md](./EventSystem.md) - Event types and emission
- [InputSystem.md](./InputSystem.md) - Async input request handling
- [InteractionDesign.md](../UI Design/InteractionDesign.md) - UI interaction patterns
