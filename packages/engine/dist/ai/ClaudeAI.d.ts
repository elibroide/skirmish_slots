import type { GameAction, GameState, PlayerId, GameLogEntry } from '../core/types';
import type { GameEngine } from '../core/GameEngine';
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
/**
 * ClaudeAI - AI player powered by Anthropic's Claude API
 * * Strategy Update:
 * - Injects "Grandmaster" heuristics into the System Prompt.
 * - Pre-calculates lane states (Winning/Losing) so the AI doesn't have to do math.
 * - Adds strategic tags to cards to help identify roles (Engine vs Finisher).
 */
export declare class ClaudeAI {
    playerId: PlayerId;
    name: string;
    private config;
    private totalInputTokens;
    private totalOutputTokens;
    private engine;
    constructor(playerId: PlayerId, config?: ClaudeConfig);
    /**
     * Set engine reference (needed for proper legal action validation)
     */
    setEngine(engine: GameEngine): void;
    /**
     * Select the best action for the current game state
     */
    selectAction(state: GameState, gameHistory?: GameLogEntry[]): Promise<AIDecision>;
    /**
     * Call Claude API via local proxy server
     */
    private callClaude;
    /**
     * Build prompt with injected STRATEGY and ANALYSIS
     */
    private buildPrompt;
    /**
     * CUSTOMIZE HERE: Assign strategic tags to cards
     * This helps the AI understand the *role* of a card, not just its text.
     */
    private getStrategyTags;
    /**
     * New Analysis: Tells the AI who is winning the "Resource War"
     */
    private analyzeResources;
    /**
     * New Analysis: Explicitly states who is winning each lane
     */
    private analyzeBattlefield;
    private serializeGameState;
    /**
     * Enhanced with Strategy Tags
     */
    private serializeCardCatalog;
    private serializeHand;
    private serializeLegalActions;
    private serializeLegalActionsDetailed;
    private serializeLegalActionsFallback;
    private serializeHistory;
    private parseResponse;
    private isActionValid;
    private getFallbackAction;
    /**
     * The "Grandmaster" System Prompt
     * Explicitly teaches the AI how to play Skirmish/Gwent
     */
    private getGrandmasterSystemPrompt;
}
export {};
