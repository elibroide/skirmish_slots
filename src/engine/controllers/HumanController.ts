import type { GameEvent, PlayerId } from '../types';
import type { PlayerController } from './PlayerController';

/**
 * Controller for human players.
 * Humans interact via UI, so this controller does nothing on events.
 */
export class HumanController implements PlayerController {
  public readonly type = 'human' as const;

  constructor(public playerId: PlayerId) {}

  onEvent(event: GameEvent): void {
    // Human players don't auto-respond to events
    // They interact via UI clicks which call engine.submitAction directly
    if (event.type === 'ACTION_REQUIRED' && event.playerId === this.playerId) {
      // UI will show "Your Turn" and wait for user input
    }

    if (event.type === 'TARGET_REQUIRED' && event.playerId === this.playerId) {
      // UI will highlight valid targets and wait for user click
    }
  }
}
