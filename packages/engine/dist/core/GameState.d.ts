import type { GameState, TerrainState, PlayerId, TerrainId, LeaderState, UnitState } from './types';
import type { Card } from '../mechanics/cards/Card';
import { Player } from '../entities/Player';
import type { GameEngine } from './GameEngine';
import type { SeededRNG } from './SeededRNG';
/**
 * Create an initial game state for a new game
 */
export declare function createInitialGameState(deck1: Card[], deck2: Card[], engine: GameEngine, rng: SeededRNG, leader1Id?: string, leader2Id?: string, startingPlayer?: PlayerId): {
    players: [Player, Player];
    terrains: [TerrainState, TerrainState, TerrainState, TerrainState, TerrainState];
    leaders: [LeaderState, LeaderState];
    currentSkirmish: number;
    currentTurn: number;
    currentPlayer: PlayerId;
    isDone: [boolean, boolean];
    hasActedThisTurn: [boolean, boolean];
    hasPlayedCardThisTurn: [boolean, boolean];
    tieSkirmishes: number;
    matchWinner: PlayerId | undefined;
};
/**
 * Helper to get opponent player ID
 */
export declare function getOpponent(playerId: PlayerId): PlayerId;
/**
 * Helper to get adjacent terrain IDs
 */
export declare function getAdjacentTerrains(terrainId: number): number[];
/**
 * Helper to get unit in front (opposite player's unit on same terrain)
 */
export declare function getUnitInFront(state: GameState, terrainId: TerrainId, playerId: PlayerId): UnitState | null;
