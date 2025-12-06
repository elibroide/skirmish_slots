import type { GameAction, GameState, PlayerId, TerrainId } from '../types';
import type { AIPlayer } from './AIPlayer';

/**
 * Simple random AI that:
 * - Declares done if it has no cards in hand
 * - Plays random cards
 * - Prefers empty terrains to avoid consuming units
 */
export class RandomAI implements AIPlayer {
  constructor(public playerId: PlayerId) {}

  decideAction(state: GameState): GameAction | null {
    const player = state.players[this.playerId];

    // Declare done if we have no cards in hand
    if (player.hand.length === 0) {
      return {
        type: 'DONE',
        playerId: this.playerId,
      };
    }

    // Pick a random card from hand
    const randomCard = player.hand[Math.floor(Math.random() * player.hand.length)];

    // If it's a unit card, pick a terrain intelligently
    if ('power' in randomCard) {
      // Find empty terrains first (to avoid consuming)
      const emptyTerrains: TerrainId[] = [];
      const occupiedTerrains: TerrainId[] = [];

      for (let i = 0; i < 5; i++) {
        const terrain = state.terrains[i as TerrainId];
        if (terrain.slots[this.playerId].unit === null) {
          emptyTerrains.push(i as TerrainId);
        } else {
          occupiedTerrains.push(i as TerrainId);
        }
      }

      // Prefer empty terrains, only use occupied if all are full
      let targetTerrain: TerrainId;
      if (emptyTerrains.length > 0) {
        targetTerrain = emptyTerrains[Math.floor(Math.random() * emptyTerrains.length)];
      } else {
        targetTerrain = occupiedTerrains[Math.floor(Math.random() * occupiedTerrains.length)];
      }

      return {
        type: 'PLAY_CARD',
        playerId: this.playerId,
        cardId: randomCard.id,
        terrainId: targetTerrain,
      };
    }

    // It's an action card - play without target for now
    // (V2 action cards will define their own targeting logic)
    return {
      type: 'PLAY_CARD',
      playerId: this.playerId,
      cardId: randomCard.id,
    };
  }
}
