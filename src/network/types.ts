import type { GameAction } from '../engine/types';

/**
 * Network Action Types
 * 
 * GameActions are the atomic units of the event-sourced game log.
 * They include: PLAY_CARD, ACTIVATE, DONE, and INPUT (for targeting/choices).
 * Each action can include an optional checksum for sync verification.
 */

/**
 * An action entry with metadata for the event log
 */
export interface ActionEntry {
  sequenceId: number;
  action: GameAction;
  timestamp: number;
}

/**
 * Complete game session data for replay/storage
 */
export interface GameSession {
  gameId: string;
  seed: number;
  player0Deck: string[];  // Array of card IDs
  player1Deck: string[];  // Array of card IDs
  actions: ActionEntry[];
  createdAt: number;
  status: 'waiting' | 'active' | 'completed';
}

/**
 * Firebase game document structure
 */
export interface FirebaseGameDoc {
  seed: number;
  code: string; // 6-digit code for easy joining
  player0: {
    deckIds: string[];
  };
  player1: {
    deckIds: string[];
  };
  player0Ready: boolean;
  player1Ready: boolean;
  gameStarted: boolean;
  status: 'waiting' | 'active' | 'completed';
  createdAt: number;
  currentActionId: number;
}

/**
 * Firebase action document structure
 * This is a GameAction with timestamp added
 */
export type FirebaseActionDoc = GameAction & {
  timestamp: number;
};

/**
 * Desync error event
 */
export interface DesyncEvent {
  type: 'DESYNC_DETECTED';
  expected: string;
  actual: string;
  sequenceId: number;
}

