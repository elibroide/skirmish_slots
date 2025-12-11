# AI Architecture

## Overview

The AI system uses a **plugin architecture** where different AI implementations (Claude, ChatGPT, local models, etc.) conform to a common interface. This enables:
- Easy addition of new AI providers
- Consistent integration with the game engine
- Separation of AI logic from game logic
- Testing and comparison of different AI strategies

---

## Core Interface

### AIStrategy

The foundation of all AI implementations:

```typescript
interface AIDecision {
  action: GameAction;
  reasoning?: string;
}

interface AIStrategy {
  name: string;
  selectAction(
    gameState: GameState,
    playerId: PlayerId,
    gameHistory?: GameLogEntry[]
  ): Promise<AIDecision>;
}
```

**Contract:**
- `selectAction` must return a valid `GameAction` for the given `playerId`
- The action must be legal according to game rules
- `reasoning` is optional but highly recommended for analysis
- The method is async to support API calls
- Should handle errors internally and return fallback actions if needed

---

## Plugin Architecture

### Registration

AI strategies are registered with the `AIController`:

```typescript
class AIController implements PlayerController {
  constructor(
    public playerId: PlayerId,
    private strategy: AIStrategy,
    private engine: GameEngine
  ) {}
  
  async takeTurn(): Promise<void> {
    const decision = await this.strategy.selectAction(
      this.engine.state,
      this.playerId,
      this.engine.logger.getHistory()
    );
    
    // Log the action with reasoning
    this.engine.submitActionWithReasoning(
      decision.action,
      decision.reasoning
    );
  }
}
```

### Lifecycle

1. **Initialization**: Strategy is instantiated with configuration (API keys, model parameters, etc.)
2. **Game Start**: Strategy receives initial game state
3. **Turn Processing**: 
   - Engine emits `ACTION_REQUIRED` event
   - Controller calls `strategy.selectAction()`
   - Strategy analyzes state and returns decision
   - Controller submits action to engine
4. **Game End**: Strategy can be queried for statistics (tokens used, response times, etc.)

---

## State Serialization

AI strategies receive the full `GameState` object but typically need to serialize it into a more digestible format.

### Simplified State

```typescript
interface SimplifiedGameState {
  currentSkirmish: number;
  currentPlayer: PlayerId;
  yourSP: number;
  opponentSP: number;
  yourSkirmishesWon: number;
  opponentSkirmishesWon: number;
  terrains: SimplifiedTerrain[];
  yourHand: SimplifiedCard[];
  handSize: number;
  deckSize: number;
}
```

### Serialization Utilities

```typescript
class StateSerializer {
  static simplify(state: GameState, forPlayer: PlayerId): SimplifiedGameState {
    // Convert full state to AI-friendly format
    // Hide opponent's hand contents
    // Include only relevant information
  }
  
  static toPromptString(state: SimplifiedGameState): string {
    // Convert to human-readable text for LLM prompts
  }
  
  static toJSON(state: SimplifiedGameState): string {
    // Convert to structured JSON for function-calling models
  }
}
```

---

## Action Validation

### Legal Action Enumeration

The AI system provides helpers to enumerate all legal actions:

```typescript
class LegalActionGenerator {
  static getLegalActions(state: GameState, playerId: PlayerId): GameAction[] {
    const actions: GameAction[] = [];
    
    // Can always pass
    actions.push({ type: 'DONE', playerId });
    
    // Cards that can be played
    const player = state.players[playerId];
    for (const card of player.hand) {
      if (card.getType() === 'unit') {
        // Add PLAY_CARD for each valid terrain
        for (let terrainId = 0; terrainId < 5; terrainId++) {
          const slot = state.terrains[terrainId].slots[playerId];
          if (!slot.unit) {
            actions.push({
              type: 'PLAY_CARD',
              playerId,
              cardId: card.id,
              targetSlot: { terrainId: terrainId as TerrainId, playerId }
            });
          }
        }
      } else {
        // Action cards need target validation
        if (card.needsTarget()) {
          // Get valid targets and create actions
        } else {
          actions.push({
            type: 'PLAY_CARD',
            playerId,
            cardId: card.id
          });
        }
      }
    }
    
    return actions;
  }
}
```

### Post-Validation

Even with legal action generation, AI responses should be validated:

```typescript
class ActionValidator {
  static isLegal(action: GameAction, state: GameState): boolean {
    // Verify the action is legal in current state
  }
  
  static sanitize(action: GameAction, state: GameState): GameAction {
    // Attempt to fix common issues
    // Return fallback DONE action if unfixable
  }
}
```

---

## Error Handling

### Graceful Degradation

AI strategies should never crash the game:

```typescript
async selectAction(state: GameState, playerId: PlayerId): Promise<AIDecision> {
  try {
    // Attempt to get AI decision
    const decision = await this.callAPI(state, playerId);
    return decision;
  } catch (error) {
    console.error('AI decision failed:', error);
    
    // Fallback to simple heuristic or random action
    const legalActions = LegalActionGenerator.getLegalActions(state, playerId);
    const fallbackAction = this.selectFallbackAction(legalActions, state);
    
    return {
      action: fallbackAction,
      reasoning: `Fallback action due to error: ${error.message}`
    };
  }
}
```

### Timeout Handling

AI calls should have reasonable timeouts:

```typescript
const decision = await Promise.race([
  this.strategy.selectAction(state, playerId),
  this.timeout(30000) // 30 second timeout
]);
```

---

## Performance Considerations

### Response Time
- Target: < 5 seconds per action for good UX
- API calls dominate latency
- Consider showing "AI is thinking..." indicators

### Token Usage
- LLMs charge per token
- Minimize game state serialization
- Cache static information (card catalog, rules)
- Use efficient prompt templates

### Rate Limiting
- Respect API rate limits
- Implement exponential backoff for retries
- Consider request queuing for AI vs AI games

---

## Extension Points

### Custom Strategies

Implement `AIStrategy` interface for:
- Heuristic/rule-based AI
- Machine learning models
- Hybrid approaches (LLM + heuristics)
- Human-in-the-loop training

### Strategy Parameters

```typescript
interface StrategyConfig {
  temperature?: number; // For LLMs
  maxTokens?: number;
  systemPrompt?: string;
  customInstructions?: string;
}

class ClaudeAI implements AIStrategy {
  constructor(apiKey: string, config: StrategyConfig = {}) {
    this.config = { ...defaultConfig, ...config };
  }
}
```

---

**See Also:**
- [ClaudeIntegration.md](./ClaudeIntegration.md) - Claude API implementation
- [PromptEngineering.md](./PromptEngineering.md) - Prompt design
- [GameLogging.md](./GameLogging.md) - Logging AI decisions
- [../Code Architecture/PlayerController.md](../Code%20Architecture/PlayerController.md) - Controller architecture

