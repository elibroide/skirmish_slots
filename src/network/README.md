# Network Multiplayer System

## Overview

This directory contains the Event Sourcing/Command Pattern architecture for deterministic network multiplayer in Skirmish. The system ensures that both players always see the same game state by:

1. **Seeded Randomness**: All random events use a shared seed
2. **Command Log**: All player actions and inputs are logged in order
3. **State Verification**: Checksums verify both clients stay in sync
4. **Optimistic Updates**: Local actions execute immediately, then sync to opponent

## Architecture

```
Local Player Action
       ↓
  GameEngine (executes immediately)
       ↓
  onCommandExecuted callback
       ↓
  NetworkSync.uploadCommand()
       ↓
    Firebase
       ↓
  NetworkSync subscription
       ↓
  CommandBuffer.addCommand()
       ↓
  NetworkController (waits for ACTION_REQUIRED event)
       ↓
  GameEngine.submitAction()
```

## Key Components

### SeededRNG (`src/engine/SeededRNG.ts`)
Deterministic random number generator. Both players use the same seed, guaranteeing identical random outcomes.

```typescript
const rng = new SeededRNG(12345);
const randomNumber = rng.next(); // [0, 1)
const randomInt = rng.nextInt(1, 6); // [1, 6)
rng.shuffle(array); // In-place deterministic shuffle
```

### StateHasher (`src/engine/StateHasher.ts`)
Generates checksums from game state to detect desyncs.

```typescript
const checksum = StateHasher.hashStateSync(gameState);
// Returns 16-character hex string
```

### CommandBuffer (`src/network/CommandBuffer.ts`)
Stores incoming network commands indexed by sequence ID.

```typescript
const buffer = new CommandBuffer();
buffer.addCommand(0, command);
const cmd = await buffer.waitForCommand(1); // Waits if not available yet
```

### FirebaseService (`src/network/firebase.ts`)
Handles Firestore operations for game creation and command sync.

```typescript
const firebase = new FirebaseService(firebaseConfig);
const gameId = await firebase.createGame(seed, deck0Ids, deck1Ids);
await firebase.uploadCommand(gameId, sequenceId, playerId, command);
```

### NetworkSync (`src/network/NetworkSync.ts`)
Coordinates Firebase and CommandBuffer.

```typescript
const sync = new NetworkSync(gameId, commandBuffer, firebase);
sync.startListening(); // Subscribe to Firebase updates
await sync.uploadCommand(playerId, command);
sync.stop(); // Cleanup
```

### NetworkController (`src/engine/controllers/NetworkController.ts`)
Pull-based controller for remote player. Waits for ACTION_REQUIRED/INPUT_REQUIRED events, then retrieves commands from CommandBuffer.

```typescript
const controller = new NetworkController(playerId, engine, commandBuffer);
// Automatically responds to engine requests
```

### NetworkGameManager (`src/network/NetworkGameManager.ts`)
High-level API to create network games.

## Usage Example

### 1. Configure Firebase

Create a Firebase project at [firebase.google.com](https://firebase.google.com) and get your config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com", // Required for Realtime Database
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 2. Create a Network Game

```typescript
import { NetworkGameManager } from './network/NetworkGameManager';
import { CardRegistry } from './engine/cards';

// Build decks
const localDeck = [
  CardRegistry.createCard('Rookie'),
  CardRegistry.createCard('Scout'),
  // ... 30 cards total
];

const remoteDeck = [
  CardRegistry.createCard('Rookie'),
  CardRegistry.createCard('Scout'),
  // ... 30 cards total
];

// Initialize manager
const manager = new NetworkGameManager(firebaseConfig);

// Create game
const { engine, gameId, networkSync } = await manager.createGame(
  0, // Local player is Player 0
  localDeck,
  remoteDeck,
  12345 // Optional seed (auto-generated if omitted)
);

console.log(`Game created: ${gameId}`);
console.log('Share this ID with your opponent!');

// Game is now running!
// Local player actions are handled by HumanController
// Remote player actions come through NetworkController
```

### 3. Handle Desyncs (Optional)

```typescript
networkSync.onDesync((event) => {
  console.error('DESYNC DETECTED!');
  console.error('Expected checksum:', event.expected);
  console.error('Actual checksum:', event.actual);
  console.error('At command sequence:', event.sequenceId);
  
  // Show error to user
  alert('Game state mismatch detected. Please refresh.');
});
```

## Command Types

Commands represent player decisions and include:

### Action Commands
```typescript
{
  type: 'action',
  action: {
    type: 'PLAY_CARD',
    playerId: 0,
    cardId: 'card-123',
    targetSlot: { terrainId: 2, playerId: 0 }
  },
  checksum: 'a1b2c3d4e5f6...'
}
```

### Input Commands (for targeting, choices)
```typescript
{
  type: 'input',
  input: { terrainId: 3, playerId: 1 }
}
```

## Testing

Run determinism tests:

```bash
npm test src/engine/__tests__/determinism.test.ts
```

Tests verify:
- Same seed produces same results
- Different seeds produce different results
- State hashing is consistent
- Action sequences are reproducible

## Firebase Realtime Database Schema

### Structure
```
games/
  {gameId}/
    seed: number
    player0:
      deckIds: [string, ...]
    player1:
      deckIds: [string, ...]
    status: 'waiting' | 'active' | 'completed'
    createdAt: number
    currentCommandId: number
    commands/
      {sequenceId}:
        playerId: 0 | 1
        commandType: 'action' | 'input'
        commandData: any
        checksum?: string
        timestamp: number
```

### Example
```json
{
  "games": {
    "-NxAbCdEfGh123456": {
      "seed": 12345,
      "player0": {
        "deckIds": ["card-1", "card-2", "..."]
      },
      "player1": {
        "deckIds": ["card-1", "card-2", "..."]
      },
      "status": "active",
      "createdAt": 1234567890,
      "currentCommandId": 3,
      "commands": {
        "0": {
          "playerId": 0,
          "commandType": "action",
          "commandData": { "type": "PLAY_CARD", "..." },
          "checksum": "a1b2c3d4e5f6",
          "timestamp": 1234567891
        },
        "1": {
          "playerId": 1,
          "commandType": "action",
          "commandData": { "type": "PLAY_CARD", "..." },
          "checksum": "f6e5d4c3b2a1",
          "timestamp": 1234567892
        }
      }
    }
  }
}
```

## Migration from Local Games

Existing local games are unaffected:

```typescript
// Local game (old way still works)
const engine = new GameEngine(
  new HumanController(0),
  new AIController(1, engine)
);
await engine.initializeGame(deck1, deck2);

// Network game (new way)
const { engine } = await manager.createGame(0, deck1, deck2);
```

The seed parameter is optional and defaults to `Date.now()` for local games.

## Known Limitations

1. **Join Mid-Game**: The `joinGame()` method is not yet fully implemented. It requires a CardRegistry to reconstruct Card instances from IDs stored in Firebase.

2. **Reconnection**: If a player disconnects, they need to rejoin using the gameId. The system will replay all commands to catch up.

3. **Large Command Logs**: Games with hundreds of actions may have slower initial load times when joining. Consider implementing snapshots for very long games.

## Future Enhancements

- **Fast-Forward Replay**: `GameEngine.fastForward(commands)` method to quickly replay command history
- **State Snapshots**: Periodic state snapshots to speed up reconnection
- **Command Compression**: Compress command log for storage efficiency
- **Authentication**: Integrate Firebase Auth to verify player identity
- **Spectator Mode**: Allow read-only observers to watch games

## Troubleshooting

### "Firebase not initialized" error
Make sure you create a NetworkGameManager instance with valid Firebase config before creating games.

### Commands not syncing
Check your Firebase Realtime Database security rules. For development:
```json
{
  "rules": {
    ".read": "true",
    ".write": "true"
  }
}
```
⚠️ **WARNING**: These rules allow anyone to read/write. Use only for development!

### Desyncs occurring
If checksums mismatch, possible causes:
- Floating-point precision issues (should be rare with our integer-heavy game)
- Non-deterministic code paths (check for `Math.random()` usage)
- Race conditions in effect resolution
- Browser differences in crypto implementations

Enable detailed logging to diagnose:
```typescript
StateHasher.hashStateSync(state, { debug: true });
```

