import type { GameEvent, PlayerId } from '../core/types';
import type { PlayerController } from './PlayerController';
import type { GameEngine } from '../core/GameEngine';
import type { AIPlayer } from '../ai/AIPlayer';
import type { ClaudeAI } from '../ai/ClaudeAI';
/**
 * Controller for AI players.
 * Supports both synchronous (RandomAI) and async (ClaudeAI) strategies.
 */
export declare class AIController implements PlayerController {
    playerId: PlayerId;
    private engine;
    readonly type: "ai";
    private ai;
    private pendingTimeout;
    constructor(playerId: PlayerId, engine: GameEngine, ai?: AIPlayer | ClaudeAI);
    /**
     * Set a new AI strategy
     */
    setAI(ai: AIPlayer | ClaudeAI): void;
    onEvent(event: GameEvent): void;
    /**
     * Auto-select input for AI (targeting, modal choices, etc.)
     */
    private selectInput;
    /**
     * Format input options for logging
     */
    private formatInputOptions;
    /**
     * Format selected input for logging
     */
    private formatSelectedInput;
}
