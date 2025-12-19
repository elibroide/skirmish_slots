/**
 * Network Multiplayer Module
 * 
 * Event Sourcing/Command Pattern architecture for deterministic multiplayer
 */

export { CommandBuffer } from './CommandBuffer';
export { FirebaseService, type FirebaseConfig } from './firebase';
export { NetworkSync } from './NetworkSync';
export { NetworkGameManager } from './NetworkGameManager';

export type {
  ActionEntry,
  GameSession,
  FirebaseGameDoc,
  FirebaseActionDoc,
  DesyncEvent
} from './types';

