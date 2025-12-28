import type { GameState, TerrainState, PlayerId, TerrainId, UnitCard, LeaderState, UnitState } from './types';
import type { Card } from '../mechanics/cards/Card';
import { Player } from '../entities/Player';
import type { GameEngine } from './GameEngine';
import type { SeededRNG } from './SeededRNG';
import { GAME_CONSTANTS } from './constants';
import { createLeaderState } from '../mechanics/leaders';

/**
 * Create an initial game state for a new game
 */
export function createInitialGameState(
  deck1: Card[],
  deck2: Card[],
  engine: GameEngine,
  rng: SeededRNG,
  leader1Id?: string,
  leader2Id?: string,
  startingPlayer?: PlayerId
) {
  const player0 = new Player(0, engine);
  player0.setDeck([...deck1]);

  const player1 = new Player(1, engine);
  player1.setDeck([...deck2]);

  const emptyTerrain = (id: TerrainId): TerrainState => ({
    id,
    slots: {
      0: { unit: null, modifier: 0 },
      1: { unit: null, modifier: 0 },
    },
    winner: null,
  });

  return {
    players: [player0, player1] as [Player, Player],
    terrains: [emptyTerrain(0), emptyTerrain(1), emptyTerrain(2), emptyTerrain(3), emptyTerrain(4)] as [TerrainState, TerrainState, TerrainState, TerrainState, TerrainState],
    leaders: [createLeaderState(leader1Id), createLeaderState(leader2Id)] as [LeaderState, LeaderState],
    currentSkirmish: 1,
    currentTurn: 1,
    currentPlayer: startingPlayer !== undefined ? startingPlayer : (rng.next() < 0.5 ? 0 : 1),
    isDone: [false, false] as [boolean, boolean],
    hasActedThisTurn: [false, false] as [boolean, boolean],
    hasPlayedCardThisTurn: [false, false] as [boolean, boolean],
    tieSkirmishes: 0,
    matchWinner: undefined as PlayerId | undefined,
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
export function getUnitInFront(state: GameState, terrainId: TerrainId, playerId: PlayerId): UnitState | null {
  const opponentId = getOpponent(playerId);
  return state.terrains[terrainId].slots[opponentId].unit;
}
