import type { LeaderDefinition, LeaderState, PlayerId } from '../../core/types';
import type { LeaderInstance } from './Leader';
import type { GameEngine } from '../../core/GameEngine';
/**
 * Get a leader instance by ID
 * Returns definition and instantiated Leader (if any)
 */
export declare function getLeader(leaderId: string, engine: GameEngine, owner: PlayerId): LeaderInstance;
/**
 * Get a leader definition by ID
 */
export declare function getLeaderDefinition(leaderId: string): LeaderDefinition;
/**
 * Get all available leader IDs
 */
export declare function getAllLeaderIds(): string[];
/**
 * Create initial leader state for a player
 */
export declare function createLeaderState(leaderId?: string): LeaderState;
