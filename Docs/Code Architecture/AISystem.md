# AI System

## AI Interface

```typescript
interface AIStrategy {
  name: string;
  selectAction(gameState: GameState, playerId: PlayerId): Promise<GameAction>;
}
```

---

## AI Controller

```typescript
class AIController {
  constructor(
    private engine: GameEngine,
    private strategy: AIStrategy,
    private playerId: PlayerId
  ) {}

  async takeTurn(): Promise<void> {
    const action = await this.strategy.selectAction(
      this.engine.state,
      this.playerId
    );

    this.engine.processAction(action);
  }
}
```

---

## Heuristic AI

```typescript
class HeuristicAI implements AIStrategy {
  name = 'Heuristic AI';

  async selectAction(state: GameState, playerId: PlayerId): Promise<GameAction> {
    const legalActions = this.getLegalActions(state, playerId);

    // Score each action
    const scored = legalActions.map(action => ({
      action,
      score: this.scoreAction(action, state)
    }));

    // Pick best
    const best = scored.reduce((a, b) => a.score > b.score ? a : b);

    return best.action;
  }

  private scoreAction(action: GameAction, state: GameState): number {
    let score = 0;

    if (action.type === 'PLAY_CARD') {
      // Prefer playing high power units
      const card = this.findCard(action.cardId, state);
      if (card instanceof UnitCard) {
        score += card.power * 10;
      }

      // Prefer contesting opponent slots
      if (action.slotId !== undefined) {
        const slot = state.slots[action.slotId];
        const opponentUnit = slot.units[1 - state.currentPlayer];
        if (opponentUnit) {
          score += 50; // Bonus for contesting
        }
      }
    }

    if (action.type === 'PASS') {
      // Only pass if winning
      const vp = this.calculateVP(state, state.currentPlayer);
      if (vp >= 3) {
        score += 100;
      } else {
        score -= 100;
      }
    }

    return score;
  }
}
```

---

## Claude AI

```typescript
class ClaudeAI implements AIStrategy {
  name = 'Claude AI';
  private apiKey: string;

  async selectAction(state: GameState, playerId: PlayerId): Promise<GameAction> {
    const prompt = this.buildPrompt(state, playerId);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    const data = await response.json();
    const actionJson = JSON.parse(data.content[0].text);

    return this.validateAndConvert(actionJson, state);
  }

  private buildPrompt(state: GameState, playerId: PlayerId): string {
    return `
You are playing a card game. Choose your action.

Game State:
${JSON.stringify(this.simplifyState(state), null, 2)}

Your hand:
${this.formatHand(state.players[playerId].hand)}

Respond with JSON:
{ "type": "PLAY_CARD", "cardId": "...", "slotId": 0 }
or
{ "type": "PASS" }
    `;
  }
}
```

---

**See Also:**
- [PlayerController.md](./PlayerController.md) - Player abstraction including AI
