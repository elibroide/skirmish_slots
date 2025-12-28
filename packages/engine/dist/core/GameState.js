import { Player } from '../entities/Player';
import { GAME_CONSTANTS } from './constants';
import { createLeaderState } from '../mechanics/leaders';
/**
 * Create an initial game state for a new game
 */
export function createInitialGameState(deck1, deck2, engine, rng, leader1Id, leader2Id, startingPlayer) {
    const player0 = new Player(0, engine);
    player0.setDeck([...deck1]);
    const player1 = new Player(1, engine);
    player1.setDeck([...deck2]);
    const emptyTerrain = (id) => ({
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
        leaders: [createLeaderState(leader1Id), createLeaderState(leader2Id)],
        currentSkirmish: 1,
        currentTurn: 1,
        currentPlayer: startingPlayer !== undefined ? startingPlayer : (rng.next() < 0.5 ? 0 : 1),
        isDone: [false, false],
        hasActedThisTurn: [false, false],
        hasPlayedCardThisTurn: [false, false],
        tieSkirmishes: 0,
        matchWinner: undefined,
    };
}
/**
 * Helper to get opponent player ID
 */
export function getOpponent(playerId) {
    return (1 - playerId);
}
/**
 * Helper to get adjacent terrain IDs
 */
export function getAdjacentTerrains(terrainId) {
    const adjacent = [];
    if (terrainId > 0)
        adjacent.push(terrainId - 1);
    if (terrainId < GAME_CONSTANTS.NUM_TERRAINS - 1)
        adjacent.push(terrainId + 1);
    return adjacent;
}
/**
 * Helper to get unit in front (opposite player's unit on same terrain)
 */
export function getUnitInFront(state, terrainId, playerId) {
    const opponentId = getOpponent(playerId);
    return state.terrains[terrainId].slots[opponentId].unit;
}
