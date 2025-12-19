import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  onChildAdded,
  onValue,
  off,
  runTransaction,
  type Database,
  type Unsubscribe
} from 'firebase/database';
import type { FirebaseGameDoc, FirebaseActionDoc } from './types';
import type { PlayerId, GameAction } from '../engine/types';

/**
 * Firebase configuration interface
 * Users must provide their own Firebase config
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string; // Required for Realtime Database
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Firebase Realtime Database service for network multiplayer
 */
export class FirebaseService {
  private app: FirebaseApp;
  private db: Database;

  constructor(config: FirebaseConfig) {
    this.app = initializeApp(config);
    this.db = getDatabase(this.app);
  }

  /**
   * Generate a random 6-digit code
   */
  private generateGameCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0,O,1,I for clarity
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create a new game in Realtime Database
   */
  async createGame(
    seed: number,
    player0DeckIds: string[],
    player1DeckIds: string[]
  ): Promise<{ gameId: string; code: string }> {
    // Generate unique code
    let code = this.generateGameCode();
    let codeExists = true;
    
    // Ensure code is unique
    while (codeExists) {
      const existingGameId = await this.findGameByCode(code);
      if (!existingGameId) {
        codeExists = false;
      } else {
        code = this.generateGameCode();
      }
    }

    const gameDoc: FirebaseGameDoc = {
      seed,
      code,
      player0: { deckIds: player0DeckIds },
      player1: { deckIds: player1DeckIds },
      player0Ready: false,
      player1Ready: false,
      gameStarted: false,
      status: 'waiting',
      createdAt: Date.now(),
      currentActionId: 0
    };

    const gamesRef = ref(this.db, 'games');
    const newGameRef = push(gamesRef);
    await set(newGameRef, gameDoc);
    
    // Store code → gameId mapping for quick lookup
    const codeRef = ref(this.db, `gameCodes/${code}`);
    await set(codeRef, newGameRef.key);
    
    return { gameId: newGameRef.key!, code };
  }

  /**
   * Get game data by full game ID
   */
  async getGame(gameId: string): Promise<FirebaseGameDoc | null> {
    const gameRef = ref(this.db, `games/${gameId}`);
    const snapshot = await get(gameRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return snapshot.val() as FirebaseGameDoc;
  }

  /**
   * Find game by 6-digit code using efficient lookup
   */
  async findGameByCode(code: string): Promise<string | null> {
    const codeRef = ref(this.db, `gameCodes/${code.toUpperCase()}`);
    const snapshot = await get(codeRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return snapshot.val() as string;
  }

  /**
   * Update game status
   */
  async updateGameStatus(
    gameId: string,
    status: 'waiting' | 'active' | 'completed'
  ): Promise<void> {
    const statusRef = ref(this.db, `games/${gameId}/status`);
    await set(statusRef, status);
  }

  /**
   * Upload an action to Realtime Database
   * Uses Firebase's atomic counter to ensure unique, ordered sequence IDs
   */
  async uploadAction(
    gameId: string,
    sequenceId: number,
    action: GameAction
  ): Promise<number> {
    const actionDoc: FirebaseActionDoc = {
      ...action, // Spread the entire action (includes playerId, type, checksum, etc.)
      timestamp: Date.now()
    };

    // Get the current action count atomically and increment it
    const currentActionIdRef = ref(this.db, `games/${gameId}/currentActionId`);
    
    // Use a transaction to atomically get and increment the sequence
    let assignedSequenceId: number = 0;
    await runTransaction(currentActionIdRef, (currentId) => {
      if (currentId === null) {
        assignedSequenceId = 0;
        return 1;
      }
      assignedSequenceId = currentId;
      return currentId + 1;
    });

    // Now write the action with the assigned sequence ID
    const actionRef = ref(this.db, `games/${gameId}/actions/${assignedSequenceId}`);
    await set(actionRef, actionDoc);

    return assignedSequenceId;
  }

  /**
   * Subscribe to actions for a game
   * Calls callback for each new action
   */
  subscribeToActions(
    gameId: string,
    onAction: (sequenceId: number, action: GameAction) => void
  ): Unsubscribe {
    const actionsRef = ref(this.db, `games/${gameId}/actions`);
    
    const listener = onChildAdded(actionsRef, (snapshot) => {
      const sequenceId = parseInt(snapshot.key!, 10);
      const actionDoc = snapshot.val() as FirebaseActionDoc;
      
      // Extract timestamp and convert back to GameAction
      const { timestamp, ...action } = actionDoc;
      
      onAction(sequenceId, action as GameAction);
    });

    // Return unsubscribe function
    return () => {
      off(actionsRef, 'child_added', listener);
    };
  }

  /**
   * Set player ready status
   */
  async setPlayerReady(gameId: string, playerId: PlayerId): Promise<void> {
    const readyRef = ref(this.db, `games/${gameId}/player${playerId}Ready`);
    await set(readyRef, true);
    
    // Check if both players are ready
    const gameData = await this.getGame(gameId);
    if (gameData && gameData.player0Ready && gameData.player1Ready && !gameData.gameStarted) {
      // Both players ready - start the game!
      const gameStartedRef = ref(this.db, `games/${gameId}/gameStarted`);
      await set(gameStartedRef, true);
      await this.updateGameStatus(gameId, 'active');
    }
  }

  /**
   * Subscribe to game ready state changes
   */
  subscribeToReadyState(
    gameId: string,
    onReadyChange: (gameData: FirebaseGameDoc) => void
  ): Unsubscribe {
    const gameRef = ref(this.db, `games/${gameId}`);
    
    return onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        onReadyChange(snapshot.val() as FirebaseGameDoc);
      }
    });
  }

  /**
   * Get all actions for a game (for replay/debugging)
   */
  async getAllActions(gameId: string): Promise<Array<{
    sequenceId: number;
    action: GameAction;
  }>> {
    const actionsRef = ref(this.db, `games/${gameId}/actions`);
    const snapshot = await get(actionsRef);

    const actions: Array<{
      sequenceId: number;
      action: GameAction;
    }> = [];

    if (!snapshot.exists()) {
      return actions;
    }

    const actionsData = snapshot.val();
    
    Object.keys(actionsData).forEach((key) => {
      const sequenceId = parseInt(key, 10);
      const actionDoc = actionsData[key] as FirebaseActionDoc;
      
      // Extract timestamp and convert back to GameAction
      const { timestamp, ...action } = actionDoc;
      
      actions.push({ sequenceId, action: action as GameAction });
    });

    // Sort by sequence ID
    actions.sort((a, b) => a.sequenceId - b.sequenceId);

    return actions;
  }
}

