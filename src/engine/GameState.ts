import type { GameState, TerrainState, PlayerId, TerrainId, UnitCard } from './types';
import type { Card } from './cards/Card';
import { Player } from './Player';
import type { GameEngine } from './GameEngine';
import type { SeededRNG } from './SeededRNG';
import { GAME_CONSTANTS } from '../utils/constants';

/**
 * Create an initial game state for a new game
 */
export function createInitialGameState(
  deck1: Card[],
  deck2: Card[],
  engine: GameEngine,
  rng: SeededRNG
): GameState {
  const player0 = new Player(0, engine);
  player0.deck = [...deck1];
  
  const player1 = new Player(1, engine);
  player1.deck = [...deck2];

  const emptyTerrain = (id: TerrainId): TerrainState => ({
    id,
    slots: {
      0: { unit: null, modifier: 0 },
      1: { unit: null, modifier: 0 },
    },
    winner: null,
  });

  return {
    players: [player0, player1],
    terrains: [emptyTerrain(0), emptyTerrain(1), emptyTerrain(2), emptyTerrain(3), emptyTerrain(4)],
    currentSkirmish: 1,  // Changed from currentRound
    currentPlayer: rng.next() < 0.5 ? 0 : 1, // Random starting player (deterministic)
    isDone: [false, false],           // Player locked out for skirmish
    hasActedThisTurn: [false, false], // Did player take action this turn?
    tieSkirmishes: 0,  // Changed from tieRounds
    matchWinner: undefined,
  };
}

/**
 * Helper to get opponent player ID
 */
export function getOpponent(playerId: PlayerId): PlayerId {
  return (1 - playerId) as PlayerId;
}

/**
 * Helper to get adjacent terrain IDs
 */
export function getAdjacentTerrains(terrainId: number): number[] {
  const adjacent: number[] = [];
  if (terrainId > 0) adjacent.push(terrainId - 1);
  if (terrainId < GAME_CONSTANTS.NUM_TERRAINS - 1) adjacent.push(terrainId + 1);
  return adjacent;
}

/**
 * Helper to get unit in front (opposite player's unit on same terrain)
 */
export function getUnitInFront(state: GameState, terrainId: TerrainId, playerId: PlayerId): UnitCard | null {
  const opponentId = getOpponent(playerId);
  return state.terrains[terrainId].slots[opponentId].unit;
}
