# Game Architecture

## System Components

### High-Level Diagram

```
┌─────────────────┐       ┌─────────────────┐
│                 │ Actions │                 │
│    UI Layer     │───────▶│   Game Engine   │
│                 │       │                 │
│ (React/Zustand) │Events  │  (TypeScript)   │
│                 │◀───────│                 │
└─────────────────┘       └────────┬────────┘
                                   │
                                   │
                          ┌────────▼────────┐
                          │                 │
                          │   Effect Stack  │
                          │                 │
                          └─────────────────┘
```

### Module Responsibilities

#### 1. Game Engine
*   **Authority:** Source of truth for all game state.
*   **Validation:** Checks if actions are legal.
*   **Logic:** Executes game rules via Effects.

#### 2. Effect Stack (LIFO)
*   **Ordering:** Manages the order of operations.
*   **Interrupts:** Handles immediate reactions (deaths, triggers).
*   **Sequences:** Handles chained operations (draw 3 cards).

#### 3. State Checker
*   **Passive Rules:** Checks for deaths, win conditions, etc.
*   **Timing:** Runs after every atomic effect resolution.

#### 4. Event Emitter
*   **Communication:** Broadcasts changes to the UI.
*   **Decoupling:** Engine doesn't know about React.

---

## Data Structures

### Game State
```typescript
interface GameState {
  players: PlayerState[];
  terrains: TerrainState[];
  // ...
}
```

### Game Action
```typescript
type GameAction = 
  | { type: 'PLAY_CARD', ... }
  | { type: 'DONE', ... }
```

### Game Event
```typescript
type GameEvent = 
  | { type: 'UNIT_DIED', ... }
  | { type: 'CARD_PLAYED', ... }
```

---

## Core Systems Implementation

### 1. Engine Core
See [EngineCore.md](./EngineCore.md)

### 2. Effect Stack System
See [EffectSystem.md](./EffectSystem.md)

### 3. Card System
See [CardSystem.md](./CardSystem.md)

### 4. Event System
See [EventSystem.md](./EventSystem.md)

---

## Design Decisions

### Why Event-Driven?
*   Decouples UI from Logic.
*   Allows for easy replay system (just log actions).
*   Makes network synchronization easier (sync actions/events).

### Why Effect Stack?
*   Solves the "Interrupt Problem" (death triggers happening too late).
*   Matches standard TCG logic (Magic stack).
*   Handles nested triggers cleanly.
