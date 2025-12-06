# Replay System

## Action Logger

```typescript
class ActionLogger {
  private log: ActionLogEntry[] = [];

  record(action: GameAction, timestamp: number): void {
    this.log.push({
      action,
      timestamp,
      turn: this.log.length + 1
    });
  }

  export(): ActionLog {
    return {
      gameId: generateId(),
      timestamp: Date.now(),
      actions: this.log
    };
  }

  save(filename: string): void {
    const data = JSON.stringify(this.export(), null, 2);
    // Save to file or localStorage
  }
}

interface ActionLog {
  gameId: string;
  timestamp: number;
  initialState?: GameState;
  actions: ActionLogEntry[];
}

interface ActionLogEntry {
  action: GameAction;
  timestamp: number;
  turn: number;
}
```

---

## Replay Player

```typescript
class ReplayPlayer {
  constructor(private engine: GameEngine) {}

  async playLog(log: ActionLog, speed: number = 1): Promise<void> {
    for (const entry of log.actions) {
      // Process action
      this.engine.processAction(entry.action);

      // Wait (respecting speed multiplier)
      const nextTimestamp = log.actions[log.actions.indexOf(entry) + 1]?.timestamp;
      if (nextTimestamp) {
        const delay = (nextTimestamp - entry.timestamp) / speed;
        await sleep(delay);
      }
    }
  }
}
```

---

## Integration with Engine

```typescript
class GameEngine {
  private actionLogger = new ActionLogger();

  processAction(action: GameAction): GameState {
    // Log action
    this.actionLogger.record(action, Date.now());

    // ... process action ...

    return this.state;
  }

  exportReplay(): ActionLog {
    return this.actionLogger.export();
  }
}
```

---

**See Also:**
- [EngineCore.md](./EngineCore.md) - Action processing
