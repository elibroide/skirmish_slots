import type { PlayerController } from './PlayerController';
import type { PlayerId, GameEvent } from '../types';
import type { GameEngine } from '../GameEngine';
import type { CommandBuffer } from '../../network/CommandBuffer';

/**
 * NetworkController - Handles network multiplayer actions (pull-based)
 * 
 * Works like AIController: waits for ACTION_REQUIRED/INPUT_REQUIRED events,
 * then retrieves the corresponding command from the network CommandBuffer.
 * 
 * The NetworkSync layer handles uploading local player commands to Firebase
 * and downloading remote player commands into the CommandBuffer.
 */
export class NetworkController implements PlayerController {
  public readonly type = 'network' as const;
  public readonly playerId: PlayerId;
  private engine: GameEngine;
  private commandBuffer: CommandBuffer;
  private nextCommandIndex: number = 0;
  private pendingTimeout: NodeJS.Timeout | null = null;

  constructor(
    playerId: PlayerId,
    engine: GameEngine,
    commandBuffer: CommandBuffer
  ) {
    this.playerId = playerId;
    this.engine = engine;
    this.commandBuffer = commandBuffer;
  }

  /**
   * Handle game events
   * Responds to ACTION_REQUIRED and INPUT_REQUIRED by retrieving commands from network
   */
  onEvent(event: GameEvent): void {
    // Clear any pending timeout
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    // Handle ACTION_REQUIRED for this remote player
    if (event.type === 'ACTION_REQUIRED') {
      this.pendingTimeout = setTimeout(async () => {
        try {
          if (event.playerId !== this.playerId) {
            this.nextCommandIndex++;
            return;
          }

          const action = await this.commandBuffer.waitForCommand(this.nextCommandIndex);
          
          if (action.type === 'INPUT') {
            console.error('Expected action (PLAY_CARD/ACTIVATE/DONE) but got INPUT');
            return;
          }

          this.nextCommandIndex++;
          await this.engine.submitAction(action);
        } catch (error) {
          console.error('NetworkController action failed:', error);
        }
        this.pendingTimeout = null;
      }, 100); // Small delay to allow network sync
    }

    // Handle INPUT_REQUIRED for this remote player
    if (event.type === 'INPUT_REQUIRED') {
      this.pendingTimeout = setTimeout(async () => {
        try {
          if (event.playerId !== this.playerId) {
            this.nextCommandIndex++;
            return;
          }

          const action = await this.commandBuffer.waitForCommand(this.nextCommandIndex);
          
          if (action.type !== 'INPUT') {
            console.error('Expected INPUT action but got:', action.type);
            return;
          }

          this.nextCommandIndex++;
          await this.engine.submitInput(action.input);
        } catch (error) {
          console.error('NetworkController input failed:', error);
        }
        this.pendingTimeout = null;
      }, 100); // Small delay to allow network sync
    }
  }

  /**
   * Get current command index (for debugging)
   */
  getCurrentCommandIndex(): number {
    return this.nextCommandIndex;
  }

  /**
   * Set starting command index (when joining mid-game)
   */
  setStartingCommandIndex(index: number): void {
    this.nextCommandIndex = index;
  }
}

