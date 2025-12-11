# AI System Testing

## Overview

Testing AI opponents requires special strategies beyond traditional unit testing. This document covers approaches for ensuring AI reliability, quality, and performance.

---

## Testing Pyramid

### 1. Unit Tests (Fast, Isolated)

Test individual AI components without API calls:

```typescript
describe('StateSerializer', () => {
  it('should serialize game state correctly', () => {
    const state = createTestGameState();
    const serialized = StateSerializer.simplify(state, 0);
    
    expect(serialized.currentSkirmish).toBe(1);
    expect(serialized.terrains).toHaveLength(5);
  });
  
  it('should hide opponent hand', () => {
    const state = createTestGameState();
    const serialized = StateSerializer.simplify(state, 0);
    
    // Opponent hand details should not be exposed
    expect(serialized.opponentHand).toBeUndefined();
  });
});

describe('LegalActionGenerator', () => {
  it('should always include DONE action', () => {
    const state = createTestGameState();
    const actions = LegalActionGenerator.getLegalActions(state, 0);
    
    expect(actions.some(a => a.type === 'DONE')).toBe(true);
  });
  
  it('should not allow playing to occupied slots', () => {
    const state = createOccupiedSlotState();
    const actions = LegalActionGenerator.getLegalActions(state, 0);
    
    const invalidActions = actions.filter(a => 
      a.type === 'PLAY_CARD' && 
      isSlotOccupied(a.targetSlot, state)
    );
    
    expect(invalidActions).toHaveLength(0);
  });
});
```

### 2. Integration Tests (Medium, With Mocks)

Test AI integration without real API calls:

```typescript
class MockClaudeAI implements AIStrategy {
  name = 'Mock Claude';
  private responses: AIDecision[];
  private callIndex = 0;
  
  constructor(responses: AIDecision[]) {
    this.responses = responses;
  }
  
  async selectAction(state: GameState, playerId: PlayerId): Promise<AIDecision> {
    return this.responses[this.callIndex++];
  }
}

describe('AIController with Mock AI', () => {
  it('should submit AI actions to engine', async () => {
    const mockAI = new MockClaudeAI([
      { action: { type: 'DONE', playerId: 1 }, reasoning: 'Pass' }
    ]);
    
    const controller = new AIController(1, mockAI, engine);
    const submitSpy = jest.spyOn(engine, 'submitAction');
    
    await controller.onEvent({ type: 'ACTION_REQUIRED', playerId: 1 });
    
    expect(submitSpy).toHaveBeenCalledWith(
      { type: 'DONE', playerId: 1 },
      'Pass'
    );
  });
  
  it('should handle AI errors gracefully', async () => {
    const failingAI = new MockClaudeAI([]);
    failingAI.selectAction = jest.fn().mockRejectedValue(new Error('API Error'));
    
    const controller = new AIController(1, failingAI, engine);
    
    // Should not crash
    await expect(async () => {
      await controller.onEvent({ type: 'ACTION_REQUIRED', playerId: 1 });
    }).not.toThrow();
  });
});
```

### 3. End-to-End Tests (Slow, Real API)

Test with actual AI providers (sparingly, in CI only):

```typescript
describe('ClaudeAI E2E', () => {
  it('should make valid moves in real game', async () => {
    const ai = new ClaudeAI({ apiKey: process.env.TEST_API_KEY });
    const engine = createTestEngine();
    
    for (let turn = 0; turn < 10; turn++) {
      const decision = await ai.selectAction(engine.state, 1);
      
      expect(isValidAction(decision.action, engine.state)).toBe(true);
      expect(decision.reasoning).toBeTruthy();
      
      engine.submitAction(decision.action);
    }
  }, 60000); // 60s timeout
});
```

---

## Behavioral Testing

### AI vs AI Matches

Test AI quality by having it play against itself:

```typescript
async function runAIvsAIMatch(
  ai1: AIStrategy,
  ai2: AIStrategy,
  games: number = 100
): Promise<MatchStats> {
  const results = { ai1Wins: 0, ai2Wins: 0, draws: 0 };
  
  for (let i = 0; i < games; i++) {
    const winner = await playFullGame(ai1, ai2);
    
    if (winner === 0) results.ai1Wins++;
    else if (winner === 1) results.ai2Wins++;
    else results.draws++;
  }
  
  return results;
}

describe('ClaudeAI Performance', () => {
  it('should beat RandomAI >80% of the time', async () => {
    const claude = new ClaudeAI({ apiKey: process.env.TEST_API_KEY });
    const random = new RandomAI();
    
    const stats = await runAIvsAIMatch(claude, random, 20);
    
    const claudeWinRate = stats.ai1Wins / 20;
    expect(claudeWinRate).toBeGreaterThan(0.8);
  });
});
```

### Decision Quality Metrics

Evaluate specific decision quality:

```typescript
interface DecisionTest {
  state: GameState;
  expectedActionType: string;
  description: string;
}

const decisionTests: DecisionTest[] = [
  {
    state: createStateWherePassingWins(),
    expectedActionType: 'DONE',
    description: 'Should pass when winning 3+ terrains'
  },
  {
    state: createStateBehindInSP(),
    expectedActionType: 'PLAY_CARD',
    description: 'Should play cards when behind'
  }
];

describe('AI Decision Quality', () => {
  decisionTests.forEach(test => {
    it(test.description, async () => {
      const ai = new ClaudeAI({ apiKey: process.env.TEST_API_KEY });
      const decision = await ai.selectAction(test.state, 0);
      
      expect(decision.action.type).toBe(test.expectedActionType);
    });
  });
});
```

---

## Performance Testing

### Response Time

```typescript
describe('AI Response Time', () => {
  it('should respond within 5 seconds', async () => {
    const ai = new ClaudeAI({ apiKey: process.env.TEST_API_KEY });
    const state = createTestGameState();
    
    const start = Date.now();
    await ai.selectAction(state, 0);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000);
  });
});
```

### Token Usage

```typescript
describe('Token Efficiency', () => {
  it('should use < 1500 tokens per action', async () => {
    const ai = new ClaudeAI({ apiKey: process.env.TEST_API_KEY });
    const state = createTestGameState();
    
    await ai.selectAction(state, 0);
    const usage = ai.getUsageStats();
    
    expect(usage.inputTokens).toBeLessThan(1500);
    expect(usage.outputTokens).toBeLessThan(300);
  });
});
```

---

## Logging Analysis

### Reasoning Quality

Analyze reasoning from game logs:

```typescript
function analyzeReasoningQuality(log: GameLog): ReasoningMetrics {
  const aiActions = log.actions.filter(a => a.playerType === 'ai' && a.reasoning);
  
  return {
    averageLength: avgLength(aiActions.map(a => a.reasoning)),
    mentionsStrategy: aiActions.filter(a => 
      a.reasoning.toLowerCase().includes('strategy') ||
      a.reasoning.toLowerCase().includes('because')
    ).length / aiActions.length,
    mentionsOpponent: aiActions.filter(a =>
      a.reasoning.toLowerCase().includes('opponent')
    ).length / aiActions.length
  };
}
```

### Common Failure Modes

```typescript
function detectFailureModes(log: GameLog): FailureMode[] {
  const failures: FailureMode[] = [];
  
  // Detect repeated passing
  let consecutivePasses = 0;
  for (const action of log.actions) {
    if (action.actionType === 'DONE') {
      consecutivePasses++;
      if (consecutivePasses >= 3) {
        failures.push({ type: 'excessive_passing', turn: action.turn });
      }
    } else {
      consecutivePasses = 0;
    }
  }
  
  // Detect playing to wrong slots
  for (const action of log.actions) {
    if (action.actionType === 'PLAY_CARD' && action.details.targetSlot) {
      const slot = action.gameStateSnapshot.terrains[action.details.targetSlot.terrainId]
        .slots[action.player];
      
      if (slot.unit) {
        failures.push({ type: 'occupied_slot', turn: action.turn });
      }
    }
  }
  
  return failures;
}
```

---

## Debugging Strategies

### Verbose Logging

```typescript
class ClaudeAI {
  private debug = process.env.NODE_ENV === 'development';
  
  async selectAction(state: GameState, playerId: PlayerId) {
    if (this.debug) {
      console.log('=== AI DECISION START ===');
      console.log('State:', JSON.stringify(state, null, 2));
    }
    
    const prompt = this.buildPrompt(state, playerId);
    
    if (this.debug) {
      console.log('Prompt:', prompt);
    }
    
    const response = await this.callClaude(prompt);
    
    if (this.debug) {
      console.log('Raw Response:', response);
    }
    
    const decision = this.parseResponse(response);
    
    if (this.debug) {
      console.log('Parsed Decision:', decision);
      console.log('=== AI DECISION END ===');
    }
    
    return decision;
  }
}
```

### Replay Failed Games

```typescript
function replayFailedGame(logPath: string): void {
  const log = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
  
  const engine = createEngine();
  
  for (const action of log.actions) {
    console.log(`Turn ${action.turn}: ${action.playerType} - ${action.actionType}`);
    console.log(`Reasoning: ${action.reasoning}`);
    
    try {
      engine.submitAction(action.details);
    } catch (error) {
      console.error(`Action failed at turn ${action.turn}:`, error);
      break;
    }
  }
}
```

---

## Evaluation Metrics

### Win Rate

```typescript
interface EvaluationMetrics {
  winRate: number;
  averageGameLength: number;
  averageSkirmishesWon: number;
  actionDistribution: Record<string, number>;
}

function evaluateAI(logs: GameLog[]): EvaluationMetrics {
  const aiGames = logs.filter(log => 
    log.players.some(p => p.type === 'ai')
  );
  
  const wins = aiGames.filter(log => {
    const aiPlayer = log.players.findIndex(p => p.type === 'ai');
    return log.result.winner === aiPlayer;
  }).length;
  
  return {
    winRate: wins / aiGames.length,
    averageGameLength: average(aiGames.map(g => g.actions.length)),
    averageSkirmishesWon: average(aiGames.map(g => 
      g.result.finalScore[getAIPlayerIndex(g)]
    )),
    actionDistribution: getActionDistribution(aiGames)
  };
}
```

---

## Continuous Testing

### CI Integration

```yaml
# .github/workflows/ai-tests.yml
name: AI Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run unit tests
        run: npm test
      - name: Run AI integration tests
        env:
          TEST_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: npm run test:ai
```

### Test Budgets

Limit expensive AI tests:

```typescript
// Only run 5 real API calls per test suite
const TEST_BUDGET = {
  maxAPICalls: 5,
  maxCostDollars: 0.10
};

let apiCallCount = 0;
let totalCost = 0;

beforeEach(() => {
  if (apiCallCount >= TEST_BUDGET.maxAPICalls) {
    throw new Error('Test budget exceeded - too many API calls');
  }
});
```

---

**See Also:**
- [AIArchitecture.md](./AIArchitecture.md) - System design
- [GameLogging.md](./GameLogging.md) - Log analysis
- [ClaudeIntegration.md](./ClaudeIntegration.md) - API integration

