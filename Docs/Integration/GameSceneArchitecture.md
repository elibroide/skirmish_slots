# Game Scene Architecture

## Overview
The `GameScene` is the primary React component responsible for rendering the active gameplay state. It acts as the "View" layer in our `Engine` -> `Events` -> `Store` -> `UI` architecture.

**Goal:** Clean, declarative rendering of the game state, delegating specific behaviors to specialized functional components (`Hand`, `Board`, `Slot`), while the `GameScene` manages the high-level layout and integration with the `GameEngine`.

## Architecture Principles
1.  **Pure Composition**: `GameScene` composes high-level zones (`PlayerZone`, `BoardZone`, `OpponentZone`) rather than rendering primitives.
2.  **Single Source of Truth**: All data comes from `useGameStore`. `GameScene` selects the `gameState` and passes relevant slices to children (or children select their own slices if they are smart components - *Decision: Smart Components preferred for `Hand` and `Board` to minimize prop drilling, but `GameScene` controls layout*).
3.  **Event-Driven Actions**: User interactions (Card Drop, Pass Click) are transformed immediately into `engine.submitAction()` calls. No local state simulations (except for transient UI animations).

## Component Hierarchy

```
GameScene
├── GameLayout (CSS Grid/Flex container)
│   ├── OpponentZone
│   │   ├── OpponentHand (Card Backs / Counts)
│   │   │   └── CardBack (x N)
│   │   └── OpponentAvatar / Stats
│   │
│   ├── BoardZone (The Battlefield)
│   │   ├── TurnIndicators (Left/Right arrows/glows)
│   │   └── Board (5 Columns)
│   │       ├── OpponentSlot (Top)
│   │       │   └── CardInstance (if present)
│   │       ├── TerrainInfo (Middle - e.g. modifiers)
│   │       └── PlayerSlot (Bottom)
│   │           └── CardInstance (if present)
│   │
│   └── PlayerZone
│       ├── PlayerHand (Interactive)
│       │   └── Hand (Card Draggables)
│       │       └── Card (Detailed View)
│       ├── PlayerStats / WinIndicators
│       └── PassButton (State-aware: Pass vs Conclude)
│
└── OverlayLayer
    ├── Tooltips (Portal)
    ├── AnimationLayer (Flying cards, attacks)
    └── GameEndModal (Victory/Defeat)
```

## Data Integration (`GameScene.tsx`)

`GameScene` will connect to the store:

```typescript
const { gameState, engine, localPlayerId } = useGameStore();
// Derived state
const isPlayerTurn = gameState.activePlayerId === localPlayerId;
const playerHand = gameState.players[localPlayerId].hand;
const boardState = gameState.board;
```

## Interaction Model

### Card Playing (Drag & Drop)
- **Source**: `Hand` component initiates drag.
- **Target**: `Slot` components are drop targets.
- **Validation**: `Slot` checks `canPlayCard(card)` helper (from Engine logic or UI helper).
- **Execution**: `onDrop` event in `Slot` triggers:
    ```typescript
    engine.submitAction({
        type: 'PLAY_CARD',
        playerId: localPlayerId,
        cardId: card.id,
        terrainId: slot.terrainId
    });
    ```
- **Feedback**: Optimistic updates are NOT used. we wait for the `Action` to be processed and the `GameState` update event to reflect changes. (Animations may bridge the gap using `AnimationLayer`).

### Passing
- `PassButton` allows "Pass" or "Conclude".
- Click triggers:
    ```typescript
    engine.submitAction({ type: 'DONE', playerId: localPlayerId }); // or 'PASS' if implemented
    ```

## Transitions from DebugScene
The `DebugScene` contained many "tuner" controls and synthetic state generation. `GameScene` will strip this out in favor of the real `gameState` from the engine.
- **Reuse**: `Hand`, `Board`, `Slot`, `Card`, `WinIndicators` components from `DebugScene` work. They should be stateless (controlled components) or connected to the store.
- **Cleanup**: Ensure `Card` and `Slot` do not depend on "Debug Settings" unless those settings are promoted to "User Preferences" (e.g. Card Scale).

## Directory Structure
```
packages/game/src/
├── scenes/
│   └── GameScene/
│       ├── GameScene.tsx        // Main Entry
│       ├── GameLayout.tsx       // Layout Grid
│       ├── PlayerZone.tsx
│       ├── BoardZone.tsx
│       └── OpponentZone.tsx
```
