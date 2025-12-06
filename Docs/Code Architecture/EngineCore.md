# Engine Core

## Responsibilities

The Game Engine is the heart of Skirmish's architecture. It maintains authoritative game state and processes all actions.

**Core Responsibilities:**
- Maintain authoritative game state
- Validate player actions
- Execute card logic (hardcoded classes)
- Resolve effects via queue (FIFO)
- Check state-based conditions
- Emit events for all state changes

---

## Structure

```
GameEngine
├── GameState (current state snapshot)
│   ├── Players[2]
│   │   ├── Hand
│   │   ├── Deck
│   │   └── VP
│   ├── Slots[4]
│   │   ├── Units (per player)
│   │   └── Ongoing Effects
│   ├── Round info
│   └── Match info
│
├── ActionProcessor
│   ├── validateAction()
│   └── processAction()
│
├── EffectQueue (FIFO)
│   ├── enqueue(effect)
│   ├── processNext()
│   └── isEmpty()
│
├── StateChecker
│   ├── checkDeaths()
│   ├── checkWinConditions()
│   └── checkRoundEnd()
│
└── EventEmitter
    └── emit(event)
```

---

## GameState Structure

### Core Components

```typescript
interface GameState {
  // Players
  players: [PlayerState, PlayerState];
  currentPlayer: PlayerId; // 0 or 1

  // Board
  slots: Slot[5]; // 5 terrains

  // Round tracking
  currentRound: number;
  roundsWon: [number, number];
  tieRounds: number;
  hasPassed: [boolean, boolean];

  // Match state
  matchWinner?: PlayerId | null; // undefined = ongoing, null = draw

  // Metadata
  gameId: string;
  timestamp: number;
}

interface PlayerState {
  id: PlayerId;
  hand: Card[];
  deck: Card[];
  discard: Card[];
  vp: number; // Current skirmish VP
}

interface Slot {
  id: SlotId; // 0-4
  units: [UnitCard | null, UnitCard | null]; // [P0, P1]
  ongoingEffects: SlotEffect[];
  winner?: PlayerId | null; // Set during resolution
}
```

---

## ActionProcessor

### Validation

```typescript
class ActionProcessor {
  validateAction(action: GameAction, state: GameState): boolean {
    // Check if it's player's turn
    if (action.playerId !== state.currentPlayer) {
      return false;
    }

    // Check if player has passed
    if (state.hasPassed[action.playerId]) {
      return false;
    }

    // Action-specific validation
    if (action.type === 'PLAY_CARD') {
      return this.validatePlayCard(action, state);
    }

    if (action.type === 'PASS') {
      return true; // Always valid if not passed yet
    }

    return false;
  }

  private validatePlayCard(action: PlayCardAction, state: GameState): boolean {
    const player = state.players[action.playerId];

    // Check card in hand
    const card = player.hand.find(c => c.id === action.cardId);
    if (!card) return false;

    // Check slot validity for units
    if (card instanceof UnitCard) {
      if (action.slotId === undefined) return false;
      if (action.slotId < 0 || action.slotId >= 5) return false;
    }

    // Check targeting if needed
    if (card.needsTarget()) {
      const validTargets = card.getValidTargets(state);
      if (!this.isValidTarget(action.targetUnitId, validTargets)) {
        return false;
      }
    }

    return true;
  }
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
  this.effectQueue.enqueue(primaryEffect);

  // 3. Process effect queue until empty
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

1. **Player sends Action**
   - UI dispatches action (e.g., PLAY_CARD)
   - Action includes: playerId, cardId, slotId, targets

2. **Engine validates Action**
   - Check turn order
   - Check card in hand
   - Check slot validity
   - Check targeting

3. **Engine applies Action**
   - Convert action to primary Effect
   - Enqueue primary Effect

4. **Engine processes Effect Queue**
   - Dequeue first effect
   - Execute effect → update state
   - Emit events for UI
   - Check for triggered effects (enqueue if any)
   - Repeat until queue empty

5. **Engine checks state-based conditions**
   - Check for deaths (power ≤ 0)
   - Check for round end (both passed)
   - Check for match end (2+ wins)
   - Enqueue effects if needed

6. **Repeat steps 4-5 until queue empty**

7. **Engine emits Events**
   - All intermediate events already emitted
   - Final STATE_SNAPSHOT event

8. **UI updates from Events**
   - GameStore receives events
   - Updates local state
   - Components re-render

---

## State Initialization

```typescript
function initializeGame(
  deck1: string[],
  deck2: string[]
): GameEngine {
  const engine = new GameEngine();

  // Create and shuffle decks
  const player0Deck = deck1.map(cardId =>
    createCard(cardId, 0, engine)
  );
  const player1Deck = deck2.map(cardId =>
    createCard(cardId, 1, engine)
  );

  shuffle(player0Deck);
  shuffle(player1Deck);

  // Initialize state
  engine.state = {
    players: [
      {
        id: 0,
        hand: [],
        deck: player0Deck,
        discard: [],
        vp: 0
      },
      {
        id: 1,
        hand: [],
        deck: player1Deck,
        discard: [],
        vp: 0
      }
    ],
    currentPlayer: 0, // Will be randomized
    slots: createEmptySlots(5),
    currentRound: 1,
    roundsWon: [0, 0],
    tieRounds: 0,
    hasPassed: [false, false],
    gameId: generateId(),
    timestamp: Date.now()
  };

  // Start first round
  engine.processAction({
    type: 'START_ROUND'
  });

  return engine;
}
```

---

## StateChecker

### Automatic Rule Enforcement

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

## Engine Integration Example

```typescript
class GameEngine {
  state: GameState;
  effectQueue: EffectQueue;
  stateChecker: StateChecker;
  eventEmitter: EventEmitter;
  actionLogger: ActionLogger;

  constructor() {
    this.effectQueue = new EffectQueue();
    this.stateChecker = new StateChecker();
    this.eventEmitter = new EventEmitter();
    this.actionLogger = new ActionLogger();
  }

  processAction(action: GameAction): GameState {
    // Log action
    this.actionLogger.record(action, Date.now());

    // Validate
    if (!this.validateAction(action)) {
      throw new Error('Invalid action');
    }

    // Process (see flow above)
    // ...

    return this.state;
  }

  onEvent(callback: (event: GameEvent) => void): () => void {
    return this.eventEmitter.subscribe(callback);
  }

  emitEvent(event: GameEvent): void {
    this.eventEmitter.emit(event);
  }
}
```

---

**See Also:**
- [EffectSystem.md](./EffectSystem.md) - Effect queue implementation
- [StateChecking.md](./StateChecking.md) - State-based condition details
- [EventSystem.md](./EventSystem.md) - Event emission and subscriptions
