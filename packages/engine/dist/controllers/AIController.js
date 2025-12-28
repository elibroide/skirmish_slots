import { RandomAI } from '../ai/RandomAI';
/**
 * Controller for AI players.
 * Supports both synchronous (RandomAI) and async (ClaudeAI) strategies.
 */
export class AIController {
    constructor(playerId, engine, ai) {
        Object.defineProperty(this, "playerId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: playerId
        });
        Object.defineProperty(this, "engine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: engine
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'ai'
        });
        Object.defineProperty(this, "ai", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pendingTimeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.ai = ai || new RandomAI(playerId);
    }
    /**
     * Set a new AI strategy
     */
    setAI(ai) {
        this.ai = ai;
    }
    onEvent(event) {
        // Clear any pending timeout to avoid duplicate actions
        if (this.pendingTimeout) {
            clearTimeout(this.pendingTimeout);
            this.pendingTimeout = null;
        }
        // Respond to ACTION_REQUIRED for this player
        if (event.type === 'ACTION_REQUIRED' && event.playerId === this.playerId) {
            // Add delay so user can see AI actions
            this.pendingTimeout = setTimeout(async () => {
                try {
                    // Notify UI that AI is thinking
                    if (typeof window !== 'undefined' && window.__GAME_STORE__) {
                        window.__GAME_STORE__.getState().setAIThinking(this.playerId);
                    }
                    // Check if AI is async (ClaudeAI) or sync (RandomAI)
                    if ('selectAction' in this.ai) {
                        // Async AI (ClaudeAI)
                        const decision = await this.ai.selectAction(this.engine.state, this.engine.logger.getHistory());
                        this.engine.submitAction(decision.action, decision.reasoning);
                    }
                    else {
                        // Sync AI (RandomAI)
                        const action = this.ai.decideAction(this.engine.state);
                        if (action) {
                            this.engine.submitAction(action);
                        }
                    }
                }
                catch (error) {
                    console.error('AI action failed:', error);
                    // Fallback to pass
                    this.engine.submitAction({
                        type: 'PASS',
                        playerId: this.playerId
                    }, 'Fallback pass due to error');
                }
                finally {
                    // Clear thinking state
                    if (typeof window !== 'undefined' && window.__GAME_STORE__) {
                        window.__GAME_STORE__.getState().setAIThinking(null);
                    }
                    this.pendingTimeout = null;
                }
            }, 1000); // 1 second delay for visibility
        }
        // Handle INPUT_REQUIRED for target selection
        if (event.type === 'INPUT_REQUIRED' && event.playerId === this.playerId) {
            this.pendingTimeout = setTimeout(() => {
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
                }
                catch (error) {
                    console.error('AI input selection failed:', error);
                }
                this.pendingTimeout = null;
            }, 500); // Short delay for visibility
        }
    }
    /**
     * Auto-select input for AI (targeting, modal choices, etc.)
     */
    selectInput(request) {
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
    formatInputOptions(request) {
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
    formatSelectedInput(input, request) {
        if (request.type === 'target' && input?.terrainId !== undefined) {
            return `Terrain ${input.terrainId}, Player ${input.playerId}`;
        }
        return JSON.stringify(input);
    }
}
