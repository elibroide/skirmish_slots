# AI Refactoring Plan (REVISED): Player Controller Abstraction

## Vision: Flexible Player Types

```
Player Types (Future):
├── HumanController     (local input)
├── AIController        (AI decision-making)
│   ├── RandomAI
│   ├── ClaudeAI
│   └── MinimaxAI
├── NetworkController   (network player)
└── RecordingController (playback from recording)
```

## Core Design: PlayerController Interface

### Step 1: Create PlayerController Abstraction

**File: `src/engine/controllers/PlayerController.ts`**
```typescript
import type { GameAction, GameState, PlayerId } from '../types';

/**
 * Abstract interface for any player controller
 * (Human, AI, Network, Recording, etc.)
 */
export interface PlayerController {
  playerId: PlayerId;
  type: 'human' | 'ai' | 'network' | 'recording';

  /**
   * Called when it's this player's turn.
   * Returns null for human players (they interact via UI)
   * Returns GameAction for automated players (AI, Network, Recording)
   */
  decideAction(state: GameState): GameAction | null;
}
```

### Step 2: Implement Controller Types

**File: `src/engine/controllers/HumanController.ts`**
```typescript
export class HumanController implements PlayerController {
  public readonly type = 'human' as const;

  constructor(public playerId: PlayerId) {}

  decideAction(state: GameState): GameAction | null {
    // Human players don't auto-decide, they use UI
    return null;
  }
}
```

**File: `src/engine/controllers/AIController.ts`**
```typescript
import { RandomAI } from '../ai/RandomAI';

export class AIController implements PlayerController {
  public readonly type = 'ai' as const;
  private ai: RandomAI;

  constructor(public playerId: PlayerId) {
    this.ai = new RandomAI(playerId);
  }

  decideAction(state: GameState): GameAction | null {
    return this.ai.decideAction(state);
  }
}
```

**File: `src/engine/controllers/NetworkController.ts`** (stub for future)
```typescript
export class NetworkController implements PlayerController {
  public readonly type = 'network' as const;

  constructor(public playerId: PlayerId, private connection: any) {}

  decideAction(state: GameState): GameAction | null {
    // TODO: Receive action from network
    return null;
  }
}
```

**File: `src/engine/controllers/RecordingController.ts`** (stub for future)
```typescript
export class RecordingController implements PlayerController {
  public readonly type = 'recording' as const;

  constructor(
    public playerId: PlayerId,
    private recording: GameAction[]
  ) {}

  decideAction(state: GameState): GameAction | null {
    // TODO: Play back next action from recording
    return null;
  }
}
```

### Step 3: Update GameStore with Controller Array

**File: `src/ui/store/gameStore.ts`**

```typescript
import type { PlayerController } from '../../engine/controllers/PlayerController';
import { HumanController, AIController } from '../../engine/controllers';

interface GameStore {
  engine: GameEngine | null;
  gameState: GameState | null;
  selectedCardId: string | null;
  isProcessing: boolean;
  gameLog: GameEvent[];

  // NEW: Array of controllers for both players
  controllers: [PlayerController, PlayerController] | null;

  // Actions
  initGame: (
    player0Type?: 'human' | 'ai',
    player1Type?: 'human' | 'ai'
  ) => void;
  playCard: (cardId: string, slotId?: SlotId) => void;
  pass: () => void;
  selectCard: (cardId: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  engine: null,
  gameState: null,
  selectedCardId: null,
  isProcessing: false,
  gameLog: [],
  controllers: null,

  initGame: (player0Type = 'human', player1Type = 'ai') => {
    const engine = initializeGame();

    // Create controllers based on parameters
    const controllers: [PlayerController, PlayerController] = [
      player0Type === 'ai'
        ? new AIController(0)
        : new HumanController(0),
      player1Type === 'ai'
        ? new AIController(1)
        : new HumanController(1),
    ];

    // Subscribe to events
    engine.onEvent((event) => {
      const currentLog = get().gameLog;
      const newLog = [...currentLog, event].slice(-100);

      if (event.type === 'STATE_SNAPSHOT') {
        set({
          gameState: event.state,
          gameLog: newLog,
          isProcessing: false,
        });

        // Check if current player needs automated action
        const currentState = event.state;
        const currentController = controllers[currentState.currentPlayer];

        // If not human and hasn't passed, let controller decide
        if (
          currentController.type !== 'human' &&
          !currentState.hasPassed[currentState.currentPlayer] &&
          currentState.matchWinner === undefined
        ) {
          setTimeout(() => {
            const action = currentController.decideAction(currentState);
            if (action) {
              if (action.type === 'PLAY_CARD') {
                get().playCard(action.cardId, action.slotId);
              } else {
                get().pass();
              }
            }
          }, 1000);
        }
      } else {
        set({ gameLog: newLog });
      }
    });

    set({
      engine,
      controllers,
      gameState: engine.state,
      selectedCardId: null,
      isProcessing: false,
      gameLog: [],
    });
  },

  // ... rest stays the same
}));
```

### Step 4: AI Module (Same as Original Plan)

**File: `src/engine/ai/AIPlayer.ts`** (interface, not used directly now)
```typescript
import type { GameAction, GameState, PlayerId } from '../types';

export interface AIPlayer {
  playerId: PlayerId;
  decideAction(state: GameState): GameAction | null;
}
```

**File: `src/engine/ai/RandomAI.ts`**
```typescript
export class RandomAI implements AIPlayer {
  constructor(public playerId: PlayerId) {}

  decideAction(state: GameState): GameAction | null {
    // ... same as original plan (ported from GameBoard)
  }
}
```

### Step 5: Update GameBoard (Remove AI Logic)

**File: `src/ui/components/GameBoard.tsx`**

```typescript
// REMOVE the entire useEffect for AI (lines 27-85)
// GameBoard now only handles user interactions
// Controllers handle automated actions
```

### Step 6: Export Structure

**File: `src/engine/controllers/index.ts`**
```typescript
export type { PlayerController } from './PlayerController';
export { HumanController } from './HumanController';
export { AIController } from './AIController';
export { NetworkController } from './NetworkController';
export { RecordingController } from './RecordingController';
```

**File: `src/engine/index.ts`**
```typescript
// ... existing exports
export * from './controllers';
export * from './ai';
```

## Usage Examples

### Default: Human vs AI
```typescript
store.initGame(); // Player 0 = human, Player 1 = AI
```

### Both Human (Local Multiplayer)
```typescript
store.initGame('human', 'human');
```

### Both AI (Watch AI Play)
```typescript
store.initGame('ai', 'ai');
```

### Future: Human vs Network
```typescript
// Later, extend initGame to accept controller instances
store.initGame(
  new HumanController(0),
  new NetworkController(1, connection)
);
```

### Future: Replay Recording
```typescript
store.initGame(
  new RecordingController(0, recording0),
  new RecordingController(1, recording1)
);
```

## File Structure

```
src/engine/
├── controllers/
│   ├── PlayerController.ts     (interface)
│   ├── HumanController.ts      (returns null)
│   ├── AIController.ts         (uses RandomAI)
│   ├── NetworkController.ts    (stub)
│   ├── RecordingController.ts  (stub)
│   └── index.ts
├── ai/
│   ├── AIPlayer.ts             (interface)
│   ├── RandomAI.ts             (implementation)
│   └── index.ts
```

## Benefits of This Design

✅ **Flexible Player Types**
- Easy to add Network, Recording, or new AI types
- No hardcoded assumptions about which player is which

✅ **Consistent Interface**
- All controllers implement same interface
- GameStore doesn't care what type each player is

✅ **Future-Proof**
- Network multiplayer: just add NetworkController
- Replay system: just add RecordingController
- AI variants: just create new AI classes

✅ **Testable**
- Can test any combination: Human vs Human, AI vs AI, etc.
- Easy to mock controllers for testing

✅ **Separation of Concerns**
- Controllers: "Who controls this player?"
- AI: "How does AI make decisions?"
- GameStore: "Coordinate controllers and engine"
- GameBoard: "Handle user input"

## Migration Path

**Phase 1 (This PR):**
- Implement HumanController, AIController, RandomAI
- Remove AI from GameBoard
- Default: Player 0 = Human, Player 1 = AI

**Phase 2 (Future):**
- Add NetworkController for multiplayer
- Add RecordingController for replay
- Add ClaudeAI, MinimaxAI, etc.

**Phase 3 (Future):**
- UI to select controller types
- Lobby system for multiplayer
- Tournament mode (AI vs AI)

## Summary of Changes

### New Files (9):
1. `src/engine/controllers/PlayerController.ts`
2. `src/engine/controllers/HumanController.ts`
3. `src/engine/controllers/AIController.ts`
4. `src/engine/controllers/NetworkController.ts` (stub)
5. `src/engine/controllers/RecordingController.ts` (stub)
6. `src/engine/controllers/index.ts`
7. `src/engine/ai/AIPlayer.ts`
8. `src/engine/ai/RandomAI.ts`
9. `src/engine/ai/index.ts`

### Modified Files (3):
1. `src/ui/store/gameStore.ts` - Add controllers array, update initGame
2. `src/ui/components/GameBoard.tsx` - Remove AI useEffect
3. `src/engine/index.ts` - Export controllers and ai

## Answers to Your Questions

**"Player will later be - Human or Recording"**
✅ Yes! HumanController and RecordingController

**"Opponent will later be - Network or Recording or AI random or AI Claude"**
✅ Yes! NetworkController, RecordingController, AIController (with different AI strategies)

**Does the plan work with this understanding?**
✅ Yes! The controller abstraction supports all these cases. You just swap controllers without changing the engine or UI.

---

## Implementation Status (M3)

### Implemented Controllers

**HumanController** ✅
- Handles local player input via UI
- Waits for user interaction
- Implemented in `src/engine/controllers/HumanController.ts`

**AIController** ✅
- Handles AI decision-making
- Supports multiple AI strategies (HeuristicAI, ClaudeAI)
- Implemented in `src/engine/controllers/AIController.ts`

**NetworkController** 🚧 (Placeholder)
- Stub implementation created in `src/engine/controllers/NetworkController.ts`
- Interface compliant but no actual network functionality
- All methods are no-ops
- Ready for future implementation

### Future Network Implementation

The `NetworkController` placeholder is ready for expansion:

```typescript
// Current (placeholder):
export class NetworkController implements PlayerController {
  onEvent(event: GameEvent): void { }
  submitAction(action: Action): void { }
  connect(): Promise<void> { return Promise.resolve(); }
  disconnect(): void { }
}

// Future implementation will:
// - Establish WebSocket/WebRTC connection
// - Transmit actions to remote player
// - Receive actions from remote player
// - Handle reconnection and sync
// - Emit network state events (connected, disconnected, lag)
```
