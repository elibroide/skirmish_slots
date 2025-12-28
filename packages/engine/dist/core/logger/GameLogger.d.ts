import type { GameAction, GameState, PlayerId, PlayerInfo, GameLogEntry, GameLog } from '../types';
/**
 * GameLogger - Captures all game actions with full context and AI reasoning
 *
 * Features:
 * - In-memory storage of all actions
 * - Includes AI reasoning for each decision
 * - Simplified state snapshots for analysis
 * - JSON export for download and replay
 */
export declare class GameLogger {
    private gameId;
    private startTime;
    private actions;
    private players;
    private turnCounter;
    private gameResult;
    constructor(player0Info: PlayerInfo, player1Info: PlayerInfo);
    /**
     * Log a game action with optional AI reasoning
     */
    logAction(action: GameAction, playerType: 'human' | 'ai', state: GameState, reasoning?: string): void;
    /**
     * Record the final game result
     */
    setResult(winner: PlayerId | null, state: GameState): void;
    /**
     * Get the complete game log
     */
    getFullLog(): GameLog;
    /**
     * Get recent action history (for AI context)
     */
    getHistory(count?: number): GameLogEntry[];
    /**
     * Export log as JSON string
     */
    exportToJSON(): string;
    /**
     * Clear all logged actions (for new game)
     */
    clear(): void;
    /**
     * Generate a unique game ID
     */
    private generateGameId;
    /**
     * Simplify game state for logging
     */
    private simplifyState;
    /**
     * Extract human-readable action details
     */
    private extractActionDetails;
    /**
     * Find a card in player's hand, deck, or graveyard
     */
    private findCard;
    /**
     * Find a unit on the battlefield
     */
    private findUnit;
}
