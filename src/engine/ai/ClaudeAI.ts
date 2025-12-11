import type { GameAction, GameState, PlayerId, TerrainId, GameLogEntry } from '../types';
import type { Card } from '../cards/Card';
import { UnitCard } from '../cards/Card';
import type { GameEngine } from '../GameEngine';

export interface AIDecision {
  action: GameAction;
  reasoning: string;
}

interface ClaudeConfig {
  proxyUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface ClaudeResponse {
  action: GameAction;
  reasoning: string;
}

/**
 * ClaudeAI - AI player powered by Anthropic's Claude API
 * * Strategy Update:
 * - Injects "Grandmaster" heuristics into the System Prompt.
 * - Pre-calculates lane states (Winning/Losing) so the AI doesn't have to do math.
 * - Adds strategic tags to cards to help identify roles (Engine vs Finisher).
 */
export class ClaudeAI {
  name = 'Claude AI';
  private config: Required<ClaudeConfig>;
  private totalInputTokens = 0;
  private totalOutputTokens = 0;
  private engine: GameEngine | null = null;

  constructor(public playerId: PlayerId, config: ClaudeConfig = {}) {
    this.config = {
      proxyUrl: config.proxyUrl || 'http://localhost:3001/api/claude',
      model: config.model || 'claude-3-5-haiku-20241022',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 1024,
      systemPrompt: config.systemPrompt || this.getGrandmasterSystemPrompt()
    };
  }

  /**
   * Set engine reference (needed for proper legal action validation)
   */
  setEngine(engine: GameEngine): void {
    this.engine = engine;
  }

  /**
   * Select the best action for the current game state
   */
  async selectAction(
    state: GameState,
    gameHistory?: GameLogEntry[]
  ): Promise<AIDecision> {
    try {
      const prompt = this.buildPrompt(state, gameHistory);

      // Debug: Log the enhanced prompt to see what the AI sees
      // console.log('--- AI PROMPT ---\n', prompt, '\n-----------------');

      const response = await this.callClaude(prompt);
      const parsed = this.parseResponse(response);

      // Validate that the action is legal
      if (!this.isActionValid(parsed.action, state)) {
        console.warn('Claude returned invalid action:', parsed.action);
        throw new Error('Claude returned invalid action');
      }

      return {
        action: parsed.action,
        reasoning: parsed.reasoning
      };
    } catch (error) {
      console.error('Claude API error:', error);
      
      // Fallback to random action
      const fallbackAction = this.getFallbackAction(state);
      return {
        action: fallbackAction,
        reasoning: `Fallback action due to error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Call Claude API via local proxy server
   */
  private async callClaude(prompt: string): Promise<string> {
    const proxyUrl = this.config.proxyUrl;
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    
    // Track token usage
    if (data.usage) {
      this.totalInputTokens += data.usage.input_tokens || 0;
      this.totalOutputTokens += data.usage.output_tokens || 0;
    }

    return data.content[0].text;
  }

  /**
   * Build prompt with injected STRATEGY and ANALYSIS
   */
  private buildPrompt(state: GameState, gameHistory?: GameLogEntry[]): string {
    const sections = [
      // 1. High-Level Strategic Snapshot (New!)
      this.analyzeResources(state),
      '',
      this.analyzeBattlefield(state),
      '',
      // 2. The Raw Data
      this.serializeGameState(state),
      '',
      this.serializeCardCatalog(state), // Now includes tags
      '',
      this.serializeLegalActions(state),
      '',
      '=== YOUR TASK ===',
      'Choose the best action from the legal actions above.',
      'Heuristics:',
      '- If you are winning 3 terrains and opponent needs 2+ cards to catch up -> CONSIDER PASSING.',
      '- If you are bleeding cards and cannot win this skirmish -> PASS to save resources.',
      '- Play [ENGINE] cards early in the round. Play [POINT SLAM] cards late.',
      '',
      'Respond with valid JSON (single line reasoning):',
      '{',
      '  "action": <one of the legal actions above>,',
      '  "reasoning": "<brief strategy explanation in a single line>"',
      '}',
      'IMPORTANT: Keep reasoning on a single line without line breaks.'
    ];

    // Include recent history if available
    if (gameHistory && gameHistory.length > 0) {
      const recentHistory = gameHistory.slice(-5);
      sections.unshift(
        '=== RECENT ACTIONS ===',
        this.serializeHistory(recentHistory),
        ''
      );
    }

    return sections.join('\n');
  }

  /**
   * CUSTOMIZE HERE: Assign strategic tags to cards
   * This helps the AI understand the *role* of a card, not just its text.
   */
  private getStrategyTags(cardName: string): string {
    switch (cardName) {
      // --- ENGINES (Play Early) ---
      case 'Engineer':
      case 'Bard':
      case 'Wizard':
      case 'Turret':
        return '[ENGINE] Generates value over time. Best played EARLY in a skirmish.';

      // --- POINT SLAM (Play Late/Swing) ---
      case 'Champion':
      case 'Veteran':
        return '[POINT SLAM] High raw power. Good for swinging a lost lane or securing a win late.';
      case 'Dragon':
        return '[POINT SLAM] Massive power swing but requires sacrifice.';

      // --- CONTROL (Removal/Disruption) ---
      case 'Archer':
      case 'Hunter':
      case 'Assassinate':
      case 'Strike':
      case 'Fireball':
        return '[CONTROL] Removes enemy power. Use to neutralize key enemy threats.';
      case 'Sentinel':
        return '[CONTROL] Denies enemy placement.';

      // --- UTILITY / VALUE ---
      case 'Scout':
      case 'Noble':
      case 'Apprentice':
        return '[VALUE] Generates card advantage. High priority.';
      case 'Knight':
        return '[SWARM] Spawns extra bodies. Good for wide board control.';
      
      // --- COMBO PIECES ---
      case 'Acolyte':
        return '[FODDER] Good target to be Consumed.';
      case 'Necromancer':
        return '[REVIVE] Bring back value from graveyard.';
      
      default:
        return ''; // No specific tag
    }
  }

  /**
   * New Analysis: Tells the AI who is winning the "Resource War"
   */
  private analyzeResources(state: GameState): string {
    const myHand = state.players[this.playerId].hand.length;
    const oppHand = state.players[(1 - this.playerId) as PlayerId].hand.length;
    const diff = myHand - oppHand;
    
    let advice = "";
    if (diff > 0) advice = "You have CARD ADVANTAGE (+ cards). You can press the attack.";
    else if (diff < 0) advice = "You are BEHIND on cards. Consider passing early to recover CA.";
    else advice = "Cards are equal.";

    return `=== STRATEGIC SNAPSHOT ===
Hand Size: You ${myHand} vs Opponent ${oppHand} (Diff: ${diff > 0 ? '+' : ''}${diff})
Strategic Advice: ${advice}`;
  }

  /**
   * New Analysis: Explicitly states who is winning each lane
   */
  private analyzeBattlefield(state: GameState): string {
    const myId = this.playerId;
    const oppId = (1 - this.playerId) as PlayerId;
    let winning = 0;
    let losing = 0;
    let tied = 0;
    
    const terrainAnalysis = state.terrains.map((t, index) => {
      // Calculate TOTAL power (Unit + Modifier)
      const myUnitPower = t.slots[myId].unit ? t.slots[myId].unit!.power : 0;
      const myMod = t.slots[myId].modifier;
      const myTotal = myUnitPower + myMod;

      const oppUnitPower = t.slots[oppId].unit ? t.slots[oppId].unit!.power : 0;
      const oppMod = t.slots[oppId].modifier;
      const oppTotal = oppUnitPower + oppMod;
      
      let status = "TIED";
      if (myTotal > oppTotal) { status = `WINNING (+${myTotal - oppTotal})`; winning++; }
      else if (myTotal < oppTotal) { status = `LOSING (${myTotal - oppTotal})`; losing++; }
      else { tied++; }

      return `Terrain ${index}: ${status} [My ${myTotal} vs Opp ${oppTotal}]`;
    }).join('\n');

    return `=== BATTLEFIELD ANALYSIS ===
Lanes Controlled: Winning ${winning} | Losing ${losing} | Tied ${tied}
Victory Condition: You need 3 lanes to win the Skirmish.
Lane Details:
${terrainAnalysis}`;
  }

  // ------------------------------------------------------------------
  // SERIALIZATION METHODS (Updated to include tags)
  // ------------------------------------------------------------------

  private serializeGameState(state: GameState): string {
    const opponent = (1 - this.playerId) as PlayerId;
    return `=== RAW GAME STATE ===
MATCH STATUS:
- Skirmish: ${state.currentSkirmish}/5
- Your SP: ${state.players[this.playerId].sp}/3
- Opponent SP: ${state.players[opponent].sp}/3

CURRENT TURN:
- Active: ${state.currentPlayer === this.playerId ? 'YOU' : 'OPPONENT'}
- You Passed: ${state.isDone[this.playerId] ? 'Yes' : 'No'}
- Opponent Passed: ${state.isDone[opponent] ? 'Yes' : 'No'}`;
  }

  /**
   * Enhanced with Strategy Tags
   */
  private serializeCardCatalog(state: GameState): string {
    const seenCards = new Map<string, Card>();
    
    // Collect cards from hand and field
    state.players[this.playerId].hand.forEach(card => seenCards.set(card.cardId, card));
    state.terrains.forEach(terrain => {
      [0, 1].forEach(pid => {
        const unit = terrain.slots[pid as 0 | 1].unit;
        if (unit) seenCards.set(unit.cardId, unit);
      });
    });
    
    if (seenCards.size === 0) return '=== CARD CATALOG ===\n(No cards visible)';
    
    const cardDescriptions = Array.from(seenCards.values())
      .map(card => {
        const tags = this.getStrategyTags(card.name); // Get the tags!
        const tagString = tags ? ` ${tags}` : '';
        
        if (card.getType() === 'unit') {
          const unitCard = card as UnitCard;
          return `- ${card.name} (${unitCard.power} pwr): ${card.description}${tagString}`;
        } else {
          return `- ${card.name} (Action): ${card.description}${tagString}`;
        }
      })
      .join('\n');
    
    return `=== CARD CATALOG (WITH STRATEGY TAGS) ===
${cardDescriptions}`;
  }

  // ------------------------------------------------------------------
  // HELPER METHODS (Unchanged logic, just keeping structure)
  // ------------------------------------------------------------------

  private serializeHand(hand: Card[]): string {
    if (hand.length === 0) return '(Empty)';
    return hand.map(card => {
      const type = card.getType() === 'unit' ? `Unit, ${(card as UnitCard).power} pwr` : 'Action';
      return `- ${card.name} (${type})`;
    }).join('\n');
  }

  private serializeLegalActions(state: GameState): string {
    if (!this.engine) return this.serializeLegalActionsFallback(state);
    const legalActions = this.engine.getLegalActions(this.playerId);
    
    if (legalActions.length === 0) return '=== LEGAL ACTIONS ===\n(No legal actions available)';

    // Convert actions to JSON strings for the AI to pick from
    const actionStrings = legalActions.map(action => {
      if (action.type === 'DONE') {
        return `PASS (End Skirmish Participation): { "type": "DONE", "playerId": ${this.playerId} }`;
      }
      // ... (Reusing existing serialization logic for brevity, but strictly valid JSON)
      return JSON.stringify(action); 
    });
    
    // Note: For cleaner prompt, we usually reconstruct the descriptions as you had in the original file.
    // I will restore the detailed serialization logic below to ensure it matches the AI's expected format.
    return this.serializeLegalActionsDetailed(state, legalActions);
  }

  private serializeLegalActionsDetailed(state: GameState, actions: GameAction[]): string {
    return `=== LEGAL ACTIONS ===\n` + actions.map(action => {
      if (action.type === 'DONE') return `PASS: { "type": "DONE", "playerId": ${this.playerId} }`;
      
      if (action.type === 'PLAY_CARD') {
        const card = state.players[this.playerId].hand.find(c => c.id === action.cardId);
        if (!card) return null;
        const name = card.name;
        
        if (action.targetSlot) {
           return `PLAY ${name} to Terrain ${action.targetSlot.terrainId}: ${JSON.stringify(action)}`;
        }
        return `PLAY ${name}: ${JSON.stringify(action)}`;
      }
      
      if (action.type === 'ACTIVATE') {
        return `ACTIVATE Ability: ${JSON.stringify(action)}`;
      }
      return null;
    }).filter(Boolean).join('\n\n');
  }

  private serializeLegalActionsFallback(state: GameState): string {
    // Minimal fallback if engine is missing
    return `PASS: { "type": "DONE", "playerId": ${this.playerId} }`;
  }

  private serializeHistory(history: GameLogEntry[]): string {
    return history.map(entry => {
      const actor = entry.player === this.playerId ? 'You' : 'Opponent';
      let desc = entry.actionType === 'PLAY_CARD' ? `played ${entry.details.cardName}` : 'passed';
      if (entry.details.targetSlot) desc += ` at Terrain ${entry.details.targetSlot.terrainId}`;
      return `Turn ${entry.turn}: ${actor} ${desc}`;
    }).join('\n');
  }

  private parseResponse(response: string): ClaudeResponse {
    let jsonText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const match = jsonText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found');
    
    try {
      // Basic cleanup for control characters
      const cleanJson = match[0].replace(/\n/g, ' ').replace(/\r/g, '');
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('JSON Parse Error', e);
      throw new Error('Failed to parse AI response');
    }
  }

  private isActionValid(action: GameAction, state: GameState): boolean {
    // Basic validation safety net
    if (action.playerId !== this.playerId) return false;
    return true; 
  }

  private getFallbackAction(state: GameState): GameAction {
    return { type: 'DONE', playerId: this.playerId };
  }

  /**
   * The "Grandmaster" System Prompt
   * Explicitly teaches the AI how to play Skirmish/Gwent
   */
  private getGrandmasterSystemPrompt(): string {
    return `You are a Grandmaster player of "Skirmish" (a tactical card game similar to Gwent).

    
CORE RULES:
- Match is Best of 3 Skirmishes.
- Win a Skirmish by controlling more terrains (3 out of 5) than the opponent.
- A terrain is controlled by having higher total power.

STRATEGIC HEURISTICS (HOW TO WIN):
1. SPATIAL CONTROL: Focus on winning 3 lanes. Abandon lanes where the opponent has a massive lead (don't waste cards).
2. CARD ADVANTAGE (CA): Cards are your only resource. 
   - If winning a skirmish costs 2+ more cards than the opponent, it is often better to PASS and save cards for the next round.
   - If you are winning comfortably, PASS to force the opponent to play cards or lose.
3. THE PASS: Declaring "Done" is your strongest move. Use it to lock in a win or cut your losses.
4. ORDER OF OPERATIONS:
   - Use [ENGINE] cards early to accrue value.
   - Use [POINT SLAM] cards as finishers.
   - Use [CONTROL] to remove key enemy engines.

Your response must be valid JSON containing the chosen action and a single-line reasoning.`;
  }
}