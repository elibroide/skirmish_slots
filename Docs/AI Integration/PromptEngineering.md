# Prompt Engineering

## Overview

Effective prompt engineering is critical for AI opponents to make good decisions. This document covers strategies for converting game state into concise, informative prompts that enable strong AI play.

**Goals:**
- Minimize token usage (reduce costs)
- Maximize decision quality
- Provide clear context
- Enable AI reasoning

---

## System Prompt

### Base System Prompt

```
You are an expert Skirmish player. Skirmish is a tactical card game where two players compete across 5 terrains in a best-of-3 match format.

CORE RULES:
- Win by winning 3 out of 5 skirmishes
- Each skirmish consists of multiple turns where players play cards or pass
- When both players pass, the skirmish resolves
- Each terrain is won by the player with higher total power (unit power + slot modifiers)
- Win 3 terrains = win the skirmish = +1 SP (Skirmish Point)
- First to 3 SP wins the match

YOUR GOAL:
Make strategic decisions to win the match. Think multiple turns ahead, manage resources, and identify win conditions.

RESPONSE FORMAT:
Always respond with valid JSON containing:
{
  "action": <GameAction object>,
  "reasoning": "<detailed explanation>"
}
```

### Custom Instructions

Allow users to customize AI behavior:

```typescript
interface CustomInstructions {
  playstyle?: 'aggressive' | 'defensive' | 'balanced';
  priorityTerrain?: TerrainId;
  additionalContext?: string;
}

function applyCustomInstructions(systemPrompt: string, custom: CustomInstructions): string {
  let prompt = systemPrompt;
  
  if (custom.playstyle) {
    prompt += `\n\nPLAYSTYLE: ${custom.playstyle}`;
  }
  
  if (custom.additionalContext) {
    prompt += `\n\n${custom.additionalContext}`;
  }
  
  return prompt;
}
```

---

## Game State Serialization

### Minimal Effective State

Only include information needed for decision-making:

```typescript
function serializeGameState(state: GameState, playerId: PlayerId): string {
  const opponent = 1 - playerId as PlayerId;
  
  return `=== GAME STATE ===

MATCH STATUS:
- Current Skirmish: ${state.currentSkirmish}/5
- Your SP: ${state.players[playerId].sp}/3
- Opponent SP: ${state.players[opponent].sp}/3
- Skirmishes Won: You ${state.players[playerId].skirmishesWon}, Opponent ${state.players[opponent].skirmishesWon}

CURRENT TURN:
- Active Player: ${state.currentPlayer === playerId ? 'YOU' : 'OPPONENT'}
- Both Players Passed: ${state.isDone[0] && state.isDone[1] ? 'Yes (resolving soon)' : 'No'}
- You Passed: ${state.isDone[playerId] ? 'Yes' : 'No'}

TERRAINS:
${serializeTerrains(state, playerId)}

YOUR HAND (${state.players[playerId].hand.length} cards):
${serializeHand(state.players[playerId].hand)}

RESOURCES:
- Cards in Deck: ${state.players[playerId].deck.length}
- Opponent Hand Size: ${state.players[opponent].hand.length}
- Opponent Deck Size: ${state.players[opponent].deck.length}`;
}
```

### Terrain Serialization

```typescript
function serializeTerrains(state: GameState, playerId: PlayerId): string {
  const opponent = 1 - playerId as PlayerId;
  
  return state.terrains.map((terrain, idx) => {
    const yourUnit = terrain.slots[playerId].unit;
    const oppUnit = terrain.slots[opponent].unit;
    const yourMod = terrain.slots[playerId].modifier;
    const oppMod = terrain.slots[opponent].modifier;
    
    const yourPower = yourUnit ? yourUnit.power + yourMod : yourMod;
    const oppPower = oppUnit ? oppUnit.power + oppMod : oppMod;
    
    const status = terrain.winner === null ? 'ACTIVE' :
                   terrain.winner === playerId ? 'WON' : 'LOST';
    
    return `Terrain ${idx} [${status}]:
  Your Side: ${yourUnit ? `${yourUnit.name} (${yourUnit.power})` : 'Empty'}${yourMod !== 0 ? ` +${yourMod} mod` : ''} = ${yourPower} total
  Opp Side: ${oppUnit ? `${oppUnit.name} (${oppUnit.power})` : 'Empty'}${oppMod !== 0 ? ` +${oppMod} mod` : ''} = ${oppPower} total`;
  }).join('\n\n');
}
```

### Hand Serialization

```typescript
function serializeHand(hand: Card[]): string {
  return hand.map(card => {
    if (card.getType() === 'unit') {
      return `- ${card.name} (Unit, ${(card as UnitCard).power} power)`;
    } else {
      return `- ${card.name} (Action): ${card.description}`;
    }
  }).join('\n');
}
```

---

## Legal Actions

### Action Enumeration

Provide explicit list of legal actions:

```typescript
function serializeLegalActions(state: GameState, playerId: PlayerId): string {
  const actions: string[] = [];
  
  // Always can pass
  actions.push('PASS: { "type": "DONE", "playerId": ' + playerId + ' }');
  
  // Playable cards
  const player = state.players[playerId];
  player.hand.forEach(card => {
    if (card.getType() === 'unit') {
      // Find empty slots
      state.terrains.forEach((terrain, terrainId) => {
        if (!terrain.slots[playerId].unit) {
          actions.push(
            `PLAY ${card.name} at Terrain ${terrainId}: ` +
            `{ "type": "PLAY_CARD", "playerId": ${playerId}, "cardId": "${card.id}", ` +
            `"targetSlot": { "terrainId": ${terrainId}, "playerId": ${playerId} } }`
          );
        }
      });
    } else {
      // Action card
      if (!card.needsTarget()) {
        actions.push(
          `PLAY ${card.name}: ` +
          `{ "type": "PLAY_CARD", "playerId": ${playerId}, "cardId": "${card.id}" }`
        );
      } else {
        // TODO: Enumerate valid targets
      }
    }
  });
  
  return `=== LEGAL ACTIONS ===\n${actions.join('\n\n')}`;
}
```

---

## Complete Prompt Template

### Full Prompt Structure

```typescript
function buildCompletePrompt(
  state: GameState,
  playerId: PlayerId,
  gameHistory?: GameLogEntry[]
): string {
  const sections = [
    serializeGameState(state, playerId),
    '',
    serializeLegalActions(state, playerId),
    '',
    '=== YOUR TASK ===',
    'Choose the best action from the legal actions above.',
    'Consider:',
    '- Can you win this skirmish? How?',
    '- Should you contest a terrain or concede it?',
    '- Are you ahead or behind in SP?',
    '- What is your win condition?',
    '',
    'Respond with JSON:',
    '{',
    '  "action": <one of the legal actions above>,',
    '  "reasoning": "<detailed explanation of your strategy>"',
    '}'
  ];
  
  // Optionally include recent history
  if (gameHistory && gameHistory.length > 0) {
    const recentHistory = gameHistory.slice(-5); // Last 5 actions
    sections.unshift(
      '=== RECENT ACTIONS ===',
      serializeHistory(recentHistory),
      ''
    );
  }
  
  return sections.join('\n');
}
```

---

## Token Optimization

### Strategies to Reduce Tokens

**1. Abbreviate Where Possible**
```typescript
// Bad (verbose)
"Your Side: Knight (Power: 3) + Modifier: 0 = Total Power: 3"

// Good (concise)
"Your Side: Knight (3) = 3 total"
```

**2. Cache Static Information**
Don't re-send card descriptions every turn. Include them in system prompt or separate context.

**3. Omit Obvious Information**
```typescript
// Skip if obvious from context
if (terrain.winner === null) {
  // Don't need to say "This terrain hasn't been resolved yet"
}
```

**4. Use Structured Format**
JSON is more token-efficient than prose for structured data.

**5. Limit History**
Only include last N actions, not entire game history.

### Estimated Token Usage

Typical prompt for Skirmish:
- System prompt: ~500 tokens
- Game state: ~400 tokens
- Legal actions: ~300 tokens
- Recent history: ~200 tokens (if included)
- **Total: ~900-1400 tokens per turn**

Expected response: ~100-200 tokens

**Cost per action**: ~$0.002-0.004 with Claude Sonnet

---

## Advanced Techniques

### Few-Shot Examples

Include examples of good decisions:

```
EXAMPLE DECISION:

State: Skirmish 1, tied 0-0. You have Knight (3) in hand. Terrain 2 has opponent's Archer (3).

Good Action: Play Knight at Terrain 1 (empty)
Reasoning: "Rather than contesting the Archer at Terrain 2 (which would result in a draw), I'll play my Knight at an empty terrain where I can secure a win. This forces my opponent to respond and gives me a guaranteed point on Terrain 1."

Bad Action: Play Knight at Terrain 2 (to contest Archer)
Reasoning: "This creates a 3-3 draw, wasting a card without gaining advantage. Neither player wins that terrain."
```

### Strategic Hints

Add contextual hints based on game state:

```typescript
function addStrategicHints(state: GameState, playerId: PlayerId): string {
  const hints: string[] = [];
  
  const yourSP = state.players[playerId].sp;
  const oppSP = state.players[1 - playerId].sp;
  
  if (yourSP === 2 && oppSP < 2) {
    hints.push('HINT: You only need to win this skirmish to win the match!');
  }
  
  if (state.players[playerId].hand.length === 0) {
    hints.push('HINT: Your hand is empty. Consider passing.');
  }
  
  const terrainLead = calculateTerrainLead(state, playerId);
  if (terrainLead >= 3) {
    hints.push('HINT: You are winning 3+ terrains. Passing may lock in a skirmish win.');
  }
  
  return hints.length > 0 ? `\n=== HINTS ===\n${hints.join('\n')}\n` : '';
}
```

---

## Response Parsing

### Robust Parsing

```typescript
function parseAIResponse(response: string): { action: GameAction; reasoning: string } {
  // Try to extract JSON from markdown code blocks
  let jsonText = response;
  
  // Remove markdown code fences
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Find JSON object
  const match = jsonText.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('No JSON found in response');
  }
  
  try {
    const parsed = JSON.parse(match[0]);
    
    if (!parsed.action) {
      throw new Error('Response missing "action" field');
    }
    
    return {
      action: parsed.action,
      reasoning: parsed.reasoning || 'No reasoning provided'
    };
  } catch (error) {
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}
```

---

## Testing & Iteration

### Prompt Quality Metrics

1. **Action Validity Rate**: % of responses with legal actions
2. **Reasoning Quality**: Human evaluation of reasoning coherence
3. **Decision Quality**: Win rate against baseline AI
4. **Token Efficiency**: Average tokens used per turn

### A/B Testing

Test different prompt variations:

```typescript
const promptVariants = {
  verbose: buildVerbosePrompt,
  concise: buildConcisePrompt,
  structured: buildStructuredPrompt
};

function testPromptVariant(variant: string) {
  // Run games with each variant
  // Compare win rates and token usage
}
```

---

**See Also:**
- [ClaudeIntegration.md](./ClaudeIntegration.md) - API integration
- [AIArchitecture.md](./AIArchitecture.md) - Plugin system
- [Testing.md](./Testing.md) - Testing strategies

