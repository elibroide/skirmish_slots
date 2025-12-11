# Game Logging System

## Overview

The game logging system captures every action taken during a game, including full context and AI reasoning. Logs are exportable as JSON for analysis, debugging, and replay functionality.

**Key Features:**
- Captures all player actions (human and AI)
- Includes AI reasoning for each decision
- Non-intrusive (doesn't affect game logic)
- Downloadable JSON format
- Supports replay capability
- Enables AI performance analysis

---

## Log Format

### Complete Game Log

```json
{
  "gameId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-12-07T10:30:00.000Z",
  "players": [
    {
      "id": 0,
      "name": "Player 1",
      "type": "human"
    },
    {
      "id": 1,
      "name": "Claude AI",
      "type": "ai"
    }
  ],
  "result": {
    "winner": 0,
    "finalScore": [3, 1],
    "totalTurns": 24
  },
  "actions": [
    {
      "turn": 1,
      "player": 0,
      "playerType": "human",
      "actionType": "PLAY_CARD",
      "details": {
        "cardId": "card_001",
        "cardName": "Knight",
        "targetSlot": {
          "terrainId": 2,
          "playerId": 0
        }
      },
      "reasoning": null,
      "timestamp": "2025-12-07T10:30:15.123Z",
      "gameStateSnapshot": { /* simplified state */ }
    },
    {
      "turn": 2,
      "player": 1,
      "playerType": "ai",
      "actionType": "PLAY_CARD",
      "details": {
        "cardId": "card_042",
        "cardName": "Archer",
        "targetSlot": {
          "terrainId": 2,
          "playerId": 1
        }
      },
      "reasoning": "Playing Archer at terrain 2 to contest opponent's Knight. With 3 power vs their 3 power, this creates a draw which is acceptable. I want to preserve higher power units for later terrains where I can secure wins.",
      "timestamp": "2025-12-07T10:30:18.456Z",
      "gameStateSnapshot": { /* simplified state */ }
    }
  ]
}
```

### Action Log Entry

```typescript
interface GameLogEntry {
  turn: number;
  player: PlayerId;
  playerType: 'human' | 'ai';
  actionType: string;
  details: any;
  reasoning: string | null;
  timestamp: string;
  gameStateSnapshot: SimplifiedGameState;
}
```

**Fields:**
- `turn`: Sequential turn number (starts at 1)
- `player`: Player ID (0 or 1)
- `playerType`: Identifies if action was from human or AI
- `actionType`: Type of action (PLAY_CARD, DONE, ACTIVATE, etc.)
- `details`: Action-specific data (card played, target, etc.)
- `reasoning`: AI's explanation (null for human actions)
- `timestamp`: ISO-8601 timestamp
- `gameStateSnapshot`: Simplified state at time of action

---

## Logger Architecture

### GameLogger Class

```typescript
class GameLogger {
  private gameId: string;
  private startTime: Date;
  private actions: GameLogEntry[];
  private players: PlayerInfo[];
  private turnCounter: number;
  
  constructor(player0Info: PlayerInfo, player1Info: PlayerInfo) {
    this.gameId = crypto.randomUUID();
    this.startTime = new Date();
    this.actions = [];
    this.players = [player0Info, player1Info];
    this.turnCounter = 0;
  }
  
  logAction(
    action: GameAction,
    playerType: 'human' | 'ai',
    state: GameState,
    reasoning?: string
  ): void {
    this.turnCounter++;
    
    const entry: GameLogEntry = {
      turn: this.turnCounter,
      player: action.playerId,
      playerType,
      actionType: action.type,
      details: this.extractActionDetails(action, state),
      reasoning: reasoning || null,
      timestamp: new Date().toISOString(),
      gameStateSnapshot: this.simplifyState(state, action.playerId)
    };
    
    this.actions.push(entry);
  }
  
  getFullLog(): GameLog {
    return {
      gameId: this.gameId,
      timestamp: this.startTime.toISOString(),
      players: this.players,
      result: this.extractResult(),
      actions: this.actions
    };
  }
  
  exportToJSON(): string {
    return JSON.stringify(this.getFullLog(), null, 2);
  }
  
  clear(): void {
    this.actions = [];
    this.turnCounter = 0;
  }
  
  private simplifyState(state: GameState, forPlayer: PlayerId): SimplifiedGameState {
    // Convert to analysis-friendly format
  }
  
  private extractActionDetails(action: GameAction, state: GameState): any {
    // Extract human-readable action details
  }
}
```

---

## Integration with Game Engine

### Engine Modifications

```typescript
class GameEngine {
  public logger: GameLogger;
  
  constructor(controller0: PlayerController, controller1: PlayerController) {
    // ... existing setup ...
    
    this.logger = new GameLogger(
      { id: 0, name: 'Player 1', type: controller0.type },
      { id: 1, name: 'Player 2', type: controller1.type }
    );
  }
  
  submitAction(action: GameAction, reasoning?: string): void {
    const controller = this.getControllerForPlayer(action.playerId);
    
    // Log the action
    this.logger.logAction(
      action,
      controller.type === 'ai' ? 'ai' : 'human',
      this.state,
      reasoning
    );
    
    // Process the action
    this.processAction(action);
  }
}
```

### Controller Integration

AI controllers pass reasoning when submitting actions:

```typescript
class AIController {
  async onEvent(event: GameEvent): Promise<void> {
    if (event.type === 'ACTION_REQUIRED' && event.playerId === this.playerId) {
      const decision = await this.strategy.selectAction(
        this.engine.state,
        this.playerId
      );
      
      // Submit with reasoning
      this.engine.submitAction(decision.action, decision.reasoning);
    }
  }
}
```

Human controllers submit without reasoning:

```typescript
class HumanController {
  submitAction(action: GameAction): void {
    this.engine.submitAction(action); // No reasoning
  }
}
```

---

## State Simplification

### Simplified State Format

For analysis and replay, we store a simplified version of game state:

```typescript
interface SimplifiedGameState {
  currentSkirmish: number;
  currentPlayer: PlayerId;
  scores: {
    player0: { sp: number, skirmishesWon: number },
    player1: { sp: number, skirmishesWon: number }
  };
  terrains: Array<{
    id: TerrainId;
    winner: PlayerId | null;
    units: [
      { name: string, power: number } | null,
      { name: string, power: number } | null
    ];
  }>;
  handSizes: [number, number];
  deckSizes: [number, number];
}
```

**Rationale:**
- Human-readable
- Sufficient for analysis
- Smaller than full state
- No sensitive opponent information (hidden hand)

---

## Export & Download

### UI Integration

```typescript
// In GameBoard component
const handleDownloadLog = () => {
  const log = engine.logger.exportToJSON();
  const blob = new Blob([log], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `skirmish-log-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

### Zustand Store Action

```typescript
interface GameStore {
  downloadGameLog: () => void;
}

const store = create<GameStore>((set, get) => ({
  downloadGameLog: () => {
    const { engine } = get();
    if (!engine) return;
    
    const log = engine.logger.exportToJSON();
    // ... download logic ...
  }
}));
```

---

## Analysis Use Cases

### AI Performance Metrics

```typescript
function analyzeAIPerformance(log: GameLog): AIMetrics {
  const aiActions = log.actions.filter(a => a.playerType === 'ai');
  
  return {
    totalActions: aiActions.length,
    averageResponseTime: calculateAvgResponseTime(aiActions),
    winRate: log.result.winner === getAIPlayer(log) ? 1 : 0,
    reasoningQuality: analyzeReasoningQuality(aiActions)
  };
}
```

### Strategy Analysis

```typescript
function analyzeStrategy(log: GameLog, playerId: PlayerId): StrategyMetrics {
  const playerActions = log.actions.filter(a => a.player === playerId);
  
  return {
    aggression: calculateAggression(playerActions),
    terrainPreferences: analyzeTerrainChoices(playerActions),
    cardUsage: analyzeCardUsage(playerActions),
    passTiming: analyzePassTiming(playerActions)
  };
}
```

### Replay Functionality

```typescript
class GameReplayer {
  constructor(log: GameLog) {
    this.log = log;
  }
  
  replayAction(index: number): GameState {
    // Reconstruct game state at action N
    return this.log.actions[index].gameStateSnapshot;
  }
  
  replayFull(): GameState[] {
    // Replay entire game
    return this.log.actions.map(a => a.gameStateSnapshot);
  }
}
```

---

## Best Practices

### Performance
- Logging is synchronous and fast (in-memory)
- State simplification is cheap
- No I/O during gameplay
- Export only when requested

### Privacy
- Don't log sensitive information
- Opponent's hand is hidden in snapshots
- API keys never logged
- User can review before download

### Debugging
- Logs help reproduce bugs
- AI reasoning reveals decision flaws
- State snapshots enable time-travel debugging

---

**See Also:**
- [AIArchitecture.md](./AIArchitecture.md) - AI plugin system
- [PromptEngineering.md](./PromptEngineering.md) - AI decision making
- [Testing.md](./Testing.md) - Using logs for testing

