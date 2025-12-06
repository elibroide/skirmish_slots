import type { GameEvent, PlayerId } from '../types';
import type { PlayerController } from './PlayerController';
import type { GameEngine } from '../GameEngine';
import { RandomAI } from '../ai/RandomAI';

/**
 * Controller for AI players.
 * Listens for ACTION_REQUIRED events and uses RandomAI to decide actions.
 */
export class AIController implements PlayerController {
  public readonly type = 'ai' as const;
  private ai: RandomAI;
  private pendingTimeout: NodeJS.Timeout | null = null;

  constructor(
    public playerId: PlayerId,
    private engine: GameEngine
  ) {
    this.ai = new RandomAI(playerId);
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
      this.pendingTimeout = setTimeout(() => {
        const action = this.ai.decideAction(this.engine.state);
        if (action) {
          try {
            this.engine.submitAction(action);
          } catch (error) {
            console.error('AI action failed:', error);
          }
        }
        this.pendingTimeout = null;
      }, 1000); // 1 second delay for visibility
    }

    // Future: Handle TARGET_REQUIRED for multi-step decisions
    if (event.type === 'TARGET_REQUIRED' && event.playerId === this.playerId) {
      // TODO: Implement target selection when needed
    }
  }
}
