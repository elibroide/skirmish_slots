# Claude Integration

## Overview

Integration with Anthropic's Claude API to enable AI opponents powered by large language models. Claude provides strong reasoning capabilities and can be guided through structured prompts.

**API Used**: Claude Messages API  
**Model**: claude-sonnet-4-20250514  
**Documentation**: https://docs.anthropic.com/claude/reference/messages_post

---

## Configuration

### Environment Variables

```bash
# .env
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Security:**
- Never commit API keys to version control
- Use `.env.local` for local development
- In production, use secure environment variable management
- Keys are prefixed with `VITE_` to be accessible in Vite frontend

### API Key Setup

1. Get API key from https://console.anthropic.com/
2. Create `.env.local` file in project root
3. Add `VITE_ANTHROPIC_API_KEY=your-key-here`
4. Restart dev server

---

## Implementation

### ClaudeAI Class

```typescript
import type { AIStrategy, GameState, PlayerId, GameAction } from '../types';

interface ClaudeConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface ClaudeResponse {
  action: GameAction;
  reasoning: string;
}

export class ClaudeAI implements AIStrategy {
  name = 'Claude AI';
  private config: Required<ClaudeConfig>;
  
  constructor(config: ClaudeConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'claude-sonnet-4-20250514',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 1024,
      systemPrompt: config.systemPrompt || this.getDefaultSystemPrompt()
    };
  }
  
  async selectAction(
    state: GameState,
    playerId: PlayerId,
    gameHistory?: any[]
  ): Promise<{ action: GameAction; reasoning: string }> {
    try {
      const prompt = this.buildPrompt(state, playerId, gameHistory);
      const response = await this.callClaude(prompt);
      const parsed = this.parseResponse(response);
      
      return {
        action: parsed.action,
        reasoning: parsed.reasoning
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw error; // AIController will handle fallback
    }
  }
  
  private async callClaude(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: this.config.systemPrompt,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.content[0].text;
  }
  
  private buildPrompt(
    state: GameState,
    playerId: PlayerId,
    gameHistory?: any[]
  ): string {
    // See PromptEngineering.md for detailed prompt design
    return `...`; // Implemented in actual code
  }
  
  private parseResponse(response: string): ClaudeResponse {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      action: parsed.action,
      reasoning: parsed.reasoning || 'No reasoning provided'
    };
  }
  
  private getDefaultSystemPrompt(): string {
    return `You are an expert Skirmish player. Analyze the game state and choose the best action.
    
Rules:
- You win by winning 3 out of 5 skirmishes
- Each skirmish is won by having higher total power on a terrain
- You must play strategically to control multiple terrains
- Consider when to pass vs. continue playing

Respond with JSON:
{
  "action": { "type": "PLAY_CARD", "playerId": 0, "cardId": "...", "targetSlot": { "terrainId": 2, "playerId": 0 } },
  "reasoning": "Detailed explanation of why this move is optimal"
}

or

{
  "action": { "type": "DONE", "playerId": 0 },
  "reasoning": "Explanation of why passing is the right choice"
}`;
  }
}
```

---

## Request Format

### Example Request

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1024,
  "temperature": 0.7,
  "system": "You are an expert Skirmish player...",
  "messages": [{
    "role": "user",
    "content": "=== GAME STATE ===\nCurrent Skirmish: 1\n..."
  }]
}
```

### Headers

```typescript
{
  'Content-Type': 'application/json',
  'x-api-key': 'sk-ant-api03-...',
  'anthropic-version': '2023-06-01'
}
```

---

## Response Format

### Successful Response

```json
{
  "id": "msg_01...",
  "type": "message",
  "role": "assistant",
  "content": [{
    "type": "text",
    "text": "{\"action\": {...}, \"reasoning\": \"...\"}"
  }],
  "model": "claude-sonnet-4-20250514",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 1250,
    "output_tokens": 150
  }
}
```

### Error Response

```json
{
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "message": "Invalid API key"
  }
}
```

---

## Error Handling

### Common Errors

**Invalid API Key (401)**
```typescript
if (response.status === 401) {
  throw new Error('Invalid Anthropic API key. Check your .env configuration.');
}
```

**Rate Limit (429)**
```typescript
if (response.status === 429) {
  // Implement exponential backoff
  await this.retryWithBackoff(request);
}
```

**Overloaded (529)**
```typescript
if (response.status === 529) {
  throw new Error('Claude API is temporarily overloaded. Please try again.');
}
```

### Retry Logic

```typescript
private async retryWithBackoff(
  request: () => Promise<Response>,
  maxRetries = 3
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Token Usage & Costs

### Tracking Usage

```typescript
class ClaudeAI {
  private totalInputTokens = 0;
  private totalOutputTokens = 0;
  
  private recordUsage(usage: { input_tokens: number; output_tokens: number }): void {
    this.totalInputTokens += usage.input_tokens;
    this.totalOutputTokens += usage.output_tokens;
  }
  
  getUsageStats() {
    return {
      inputTokens: this.totalInputTokens,
      outputTokens: this.totalOutputTokens,
      estimatedCost: this.calculateCost()
    };
  }
  
  private calculateCost(): number {
    // Claude Sonnet pricing (as of Dec 2024)
    const inputCostPer1M = 3.00;  // $3 per 1M input tokens
    const outputCostPer1M = 15.00; // $15 per 1M output tokens
    
    return (
      (this.totalInputTokens / 1_000_000) * inputCostPer1M +
      (this.totalOutputTokens / 1_000_000) * outputCostPer1M
    );
  }
}
```

### Optimization Strategies

1. **Minimize prompt size**: See [PromptEngineering.md](./PromptEngineering.md)
2. **Cache static content**: Don't re-send card catalog every time
3. **Lower max_tokens**: Reduce to 512 if responses are consistently short
4. **Adjust temperature**: Lower temperature (0.5) for more deterministic play

---

## Testing

### Mock for Testing

```typescript
class MockClaudeAI implements AIStrategy {
  name = 'Mock Claude';
  
  async selectAction(state: GameState, playerId: PlayerId) {
    // Return predetermined actions for testing
    return {
      action: { type: 'DONE', playerId },
      reasoning: 'Mock reasoning'
    };
  }
}
```

### Integration Test

```typescript
describe('ClaudeAI', () => {
  it('should return valid action', async () => {
    const ai = new ClaudeAI({ apiKey: process.env.ANTHROPIC_API_KEY });
    const state = createTestGameState();
    
    const decision = await ai.selectAction(state, 0);
    
    expect(decision.action).toBeDefined();
    expect(decision.reasoning).toBeTruthy();
    expect(isValidAction(decision.action, state)).toBe(true);
  });
});
```

---

## Best Practices

### Prompt Engineering
- Be explicit about JSON format requirements
- Provide examples of valid actions
- Include game rules in system prompt
- See [PromptEngineering.md](./PromptEngineering.md) for details

### Performance
- Target < 5 second response times
- Show "AI is thinking" indicator
- Consider timeout after 30 seconds
- Cache expensive computations

### Reliability
- Always validate AI responses
- Have fallback actions ready
- Log all API errors
- Monitor token usage

---

**See Also:**
- [AIArchitecture.md](./AIArchitecture.md) - Plugin interface
- [PromptEngineering.md](./PromptEngineering.md) - Prompt design
- [Testing.md](./Testing.md) - Testing strategies

