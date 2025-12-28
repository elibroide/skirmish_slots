import type { GameEvent, PlayerId, InputRequest } from '../core/types';
import type { PlayerController } from './PlayerController';
import type { GameEngine } from '../core/GameEngine';
import { RandomAI } from '../ai/RandomAI';
import type { AIPlayer } from '../ai/AIPlayer';
import type { ClaudeAI } from '../ai/ClaudeAI';

/**
 * Controller for AI players.
 * Supports both synchronous (RandomAI) and async (ClaudeAI) strategies.
 */

export interface AIControllerOptions {
  actionDelay?: number; // ms, default 1000
  inputDelay?: number;  // ms, default 500
}

/**
 * Controller for AI players.
 * Supports both synchronous (RandomAI) and async (ClaudeAI) strategies.
 */
export class AIController implements PlayerController {
  public readonly type = 'ai' as const;
  private ai: AIPlayer | ClaudeAI;
  private options: AIControllerOptions;
  private pendingTimeout: any = null; // NodeJS.Timeout or null

  constructor(
    public playerId: PlayerId,
    private engine: GameEngine,
    ai?: AIPlayer | ClaudeAI,
    options?: AIControllerOptions
  ) {
    this.ai = ai || new RandomAI(playerId);
    this.options = { 
      actionDelay: 1000, 
      inputDelay: 500,
      ...options 
    };
  }

  /**
   * Set a new AI strategy
   */
  setAI(ai: AIPlayer | ClaudeAI): void {
    this.ai = ai;
  }

  onEvent(event: GameEvent): void {
    // Clear any pending timeout to avoid duplicate actions
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    // Respond to ACTION_REQUIRED for this player
    if (event.type === 'ACTION_REQUIRED' && event.playerId === this.playerId) {
      // Add delay so user can see AI actions
      this.schedule(async () => {
        try {
          // Notify UI that AI is thinking
          if (typeof window !== 'undefined' && (window as any).__GAME_STORE__) {
            (window as any).__GAME_STORE__.getState().setAIThinking(this.playerId);
          }

          // Check if AI is async (ClaudeAI) or sync (RandomAI)
          if ('selectAction' in this.ai) {
            // Async AI (ClaudeAI)
            const decision = await this.ai.selectAction(
              this.engine.state,
              this.engine.logger.getHistory()
            );
            this.engine.submitAction(decision.action, decision.reasoning);
          } else {
            // Sync AI (RandomAI)
            const action = this.ai.decideAction(this.engine.state);
            if (action) {
              this.engine.submitAction(action);
            }
          }
        } catch (error) {
          console.error('AI action failed:', error);
          
          // Fallback to pass
          this.engine.submitAction({
            type: 'PASS',
            playerId: this.playerId
          }, 'Fallback pass due to error');
        } finally {
          // Clear thinking state
          if (typeof window !== 'undefined' && (window as any).__GAME_STORE__) {
            (window as any).__GAME_STORE__.getState().setAIThinking(null);
          }
          this.pendingTimeout = null;
        }
      }, this.options.actionDelay || 0); 
    }

    // Handle INPUT_REQUIRED for target selection
    // Handle INPUT_REQUIRED for target selection
    if (event.type === 'INPUT_REQUIRED' && event.playerId === this.playerId) {
      this.schedule(() => {
        try {
          const input = this.selectInput(event.inputRequest);
          if (input !== null) {
            console.log('=== AI INPUT SELECTION ===');
            console.log('Context:', event.inputRequest.context);
            console.log('Type:', event.inputRequest.type);
            console.log('Available options:', this.formatInputOptions(event.inputRequest));
            console.log('Selected:', this.formatSelectedInput(input, event.inputRequest));
            console.log('========================');
            
            this.engine.submitInput(input);
          }
        } catch (error) {
          console.error('AI input selection failed:', error);
        }
        this.pendingTimeout = null;
      }, this.options.inputDelay || 0); 
    }
  }

  /**
   * Auto-select input for AI (targeting, modal choices, etc.)
   */
  private selectInput(request: InputRequest): any {
    if (request.type === 'target') {
      // Prefer validSlots if available (used by Archer and other targeting cards)
      if (request.validSlots && request.validSlots.length > 0) {
        return request.validSlots[0];
      }
      // Fallback to validTargetIds if provided
      if (request.validTargetIds && request.validTargetIds.length > 0) {
        return request.validTargetIds[0];
      }
    }
    
    if (request.type === 'choose_option' && request.options && request.options.length > 0) {
      return request.options[0];
    }
    
    return null;
  }

  /**
   * Format input options for logging
   */
  private formatInputOptions(request: InputRequest): string {
    if (request.type === 'target') {
      if (request.validSlots && request.validSlots.length > 0) {
        return `${request.validSlots.length} slots: ${request.validSlots.map(s => `T${s.terrainId}P${s.playerId}`).join(', ')}`;
      }
      if (request.validTargetIds && request.validTargetIds.length > 0) {
        return `${request.validTargetIds.length} targets: ${request.validTargetIds.join(', ')}`;
      }
    }
    
    if (request.type === 'choose_option' && request.options) {
      return `${request.options.length} options: ${request.options.join(', ')}`;
    }
    
    return '(none)';
  }

  /**
   * Format selected input for logging
   */
  private formatSelectedInput(input: any, request: InputRequest): string {
    if (request.type === 'target' && input?.terrainId !== undefined) {
      return `Terrain ${input.terrainId}, Player ${input.playerId}`;
    }
    
    return JSON.stringify(input);
  }

  private schedule(callback: () => void, delayMs: number): void {
    if (delayMs > 0) {
      this.pendingTimeout = setTimeout(callback, delayMs);
    } else {
      // Use queueMicrotask for 0ms delay to allow stack unwinding without wall-clock wait
      // This is ideal for tests
      queueMicrotask(() => {
         this.pendingTimeout = null; // Clear flag
         callback();
      });
      // Mark as pending via a dummy object so we don't double schedule
      this.pendingTimeout = {}; 
    }
  }
}
