import type { DesyncEvent } from './types';
import type { PlayerId, GameAction } from '@skirmish/engine';
import type { GameEngine } from "@skirmish/engine";
import type { FirebaseService } from './firebase';
import { CommandBuffer } from './CommandBuffer';

/**
 * NetworkSync - Coordinates Firebase operations and CommandBuffer
 * 
 * Manages the flow of commands between Firebase and the local game engine.
 * Handles command upload, subscription to remote commands, and desync detection.
 */
export class NetworkSync {
  private gameId: string;
  private commandBuffer: CommandBuffer;
  private firebase: FirebaseService;
  private unsubscribe?: () => void;
  private eventUnsubscribe?: () => void;
  private localSequenceId: number = 0;
  private localPlayerId: PlayerId;
  private onDesyncCallback?: (event: DesyncEvent) => void;

  constructor(
    gameId: string,
    commandBuffer: CommandBuffer,
    firebase: FirebaseService,
    localPlayerId: PlayerId,
    engine: GameEngine
  ) {
    this.gameId = gameId;
    this.commandBuffer = commandBuffer;
    this.firebase = firebase;
    this.localPlayerId = localPlayerId;

    // Subscribe to ACTION_EXECUTED events to upload local player's actions
    this.eventUnsubscribe = engine.onAction((action) => {
      if (action.playerId === localPlayerId) {
        this.uploadAction(action);
      }
    });
  }

  /**
   * Start listening to actions from Firebase
   * Automatically adds them to the CommandBuffer
   */
  startListening(): void {
    this.unsubscribe = this.firebase.subscribeToActions(
      this.gameId,
      (sequenceId, action) => {
        console.log(`[NetworkSync] Received action from Firebase:`, {
          sequenceId,
          type: action.type,
          playerId: action.playerId,
          isRemote: action.playerId !== this.localPlayerId
        });
        
        // Only buffer actions from the remote player
        if (action.playerId !== this.localPlayerId) {
          console.log(`[NetworkSync] Buffering REMOTE action (from Player ${action.playerId})`);
          this.commandBuffer.addCommand(sequenceId, action);
        } else {
          console.log(`[NetworkSync] Ignoring LOCAL action echo (from Player ${action.playerId})`);
        }
      }
    );
  }

  /**
   * Upload an action to Firebase
   * This is called after local execution (optimistic update)
   * Returns the assigned sequence ID from Firebase (atomic counter)
   */
  private async uploadAction(action: GameAction): Promise<void> {
    console.log(`[NetworkSync] Uploading LOCAL action to Firebase:`, {
      localSeqId: this.localSequenceId,
      type: action.type,
      playerId: action.playerId
    });
    const assignedSequenceId = await this.firebase.uploadAction(
      this.gameId,
      this.localSequenceId,
      action
    );
    console.log(`[NetworkSync] Action assigned sequence ID: ${assignedSequenceId}`);
    this.localSequenceId++;
  }

  /**
   * Verify checksum matches expected value
   * If mismatch detected, emits desync event
   */
  verifyChecksum(sequenceId: number, expected: string, actual: string): boolean {
    if (expected !== actual) {
      const desyncEvent: DesyncEvent = {
        type: 'DESYNC_DETECTED',
        expected,
        actual,
        sequenceId
      };
      
      if (this.onDesyncCallback) {
        this.onDesyncCallback(desyncEvent);
      }
      
      return false;
    }
    return true;
  }

  /**
   * Register callback for desync detection
   */
  onDesync(callback: (event: DesyncEvent) => void): void {
    this.onDesyncCallback = callback;
  }

  /**
   * Get current sequence ID
   */
  getCurrentSequenceId(): number {
    return this.localSequenceId;
  }

  /**
   * Get Firebase service (for accessing ready state and other methods)
   */
  getFirebase(): FirebaseService {
    return this.firebase;
  }

  /**
   * Set starting sequence ID (useful when joining mid-game)
   */
  setStartingSequenceId(sequenceId: number): void {
    this.localSequenceId = sequenceId;
  }

  /**
   * Stop listening to Firebase updates and engine events
   */
  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    if (this.eventUnsubscribe) {
      this.eventUnsubscribe();
      this.eventUnsubscribe = undefined;
    }
  }

  /**
   * Load all existing actions (for replay or late join)
   */
  async loadAllActions(): Promise<void> {
    const actions = await this.firebase.getAllActions(this.gameId);
    actions.forEach(({ sequenceId, action }) => {
      if (action.playerId !== this.localPlayerId) {
        this.commandBuffer.addCommand(sequenceId, action);
      }
    });
  }
}

