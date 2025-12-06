import type { GameState, Player, Terrain, PlayerId, Card, TerrainId, UnitCard } from './types';
import { GAME_CONSTANTS } from '../utils/constants';

/**
 * Create an initial game state for a new game
 */
export function createInitialGameState(
  deck1: Card[],
  deck2: Card[]
): GameState {
  const player0: Player = {
    id: 0,
    hand: [],
    deck: [...deck1],
    graveyard: [],  // Changed from discard
    sp: 0,  // Changed from vp
    skirmishesWon: 0,  // Changed from roundsWon
  };

  const player1: Player = {
    id: 1,
    hand: [],
    deck: [...deck2],
    graveyard: [],
    sp: 0,
    skirmishesWon: 0,
  };

  const emptyTerrain = (): Terrain => ({
    slots: {
      0: { unit: null, modifier: 0 },
      1: { unit: null, modifier: 0 },
    },
    winner: null,
  });

  return {
    players: [player0, player1],
    terrains: [emptyTerrain(), emptyTerrain(), emptyTerrain(), emptyTerrain(), emptyTerrain()],
    currentSkirmish: 1,  // Changed from currentRound
    currentPlayer: Math.random() < 0.5 ? 0 : 1, // Random starting player
    isDone: [false, false],  // Changed from hasPassed
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
