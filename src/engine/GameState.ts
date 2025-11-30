import type { GameState, Player, Slot, PlayerId, Card } from './types';
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
    discard: [],
    vp: 0,
    roundsWon: 0,
  };

  const player1: Player = {
    id: 1,
    hand: [],
    deck: [...deck2],
    discard: [],
    vp: 0,
    roundsWon: 0,
  };

  const emptySlot = (): Slot => ({
    units: [null, null],
    ongoingEffects: [],
    winner: null,
  });

  return {
    players: [player0, player1],
    slots: [emptySlot(), emptySlot(), emptySlot(), emptySlot()],
    currentRound: 1,
    currentPlayer: Math.random() < 0.5 ? 0 : 1, // Random starting player
    hasPassed: [false, false],
    tieRounds: 0,
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
 * Helper to get adjacent slot IDs
 */
export function getAdjacentSlots(slotId: number): number[] {
  const adjacent: number[] = [];
  if (slotId > 0) adjacent.push(slotId - 1);
  if (slotId < GAME_CONSTANTS.NUM_SLOTS - 1) adjacent.push(slotId + 1);
  return adjacent;
}

/**
 * Helper to get non-adjacent (far) slot IDs
 */
export function getFarSlots(slotId: number): number[] {
  const adjacent = getAdjacentSlots(slotId);
  const allSlots = Array.from({ length: GAME_CONSTANTS.NUM_SLOTS }, (_, i) => i);
  return allSlots.filter((id) => id !== slotId && !adjacent.includes(id));
}
