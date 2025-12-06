import { UnitCard } from '../Card';
import type { PlayerId, TerrainId } from '../../types';
import type { GameEngine } from '../../GameEngine';
import { getAdjacentTerrains } from '../../GameState';

/**
 * Bladed Orb (3 power)
 * Deploy: Deal 3 damage to enemy in front of me
 * Conquer: Move me to a close terrain
 */
export class BladedOrb extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('bladed_orb', 'Bladed Orb', 'Deploy: Deal 3 damage to enemy in front of me. Conquer: Move me to a close terrain', 3, owner, engine);
  }

  async onDeploy(): Promise<void> {
    // Deal 3 damage to enemy in front
    const enemyInFront = this.getUnitInFront();
    if (enemyInFront) {
      enemyInFront.dealDamage(3);
    }
  }

  async onConquer(): Promise<void> {
    // Move to a close (adjacent) terrain
    if (this.terrainId === null) return;

    const adjacentTerrainIds = getAdjacentTerrains(this.terrainId);
    if (adjacentTerrainIds.length === 0) return;

    // Find an empty adjacent terrain
    const emptyAdjacent = adjacentTerrainIds.find(terrainId => {
      const terrain = this.engine.state.terrains[terrainId as TerrainId];
      return terrain.slots[this.owner].unit === null;
    });

    if (emptyAdjacent !== undefined) {
      const oldTerrainId = this.terrainId;
      const newTerrainId = emptyAdjacent as TerrainId;

      // Remove from current terrain
      this.engine.state.terrains[oldTerrainId].slots[this.owner].unit = null;

      // Add to new terrain
      this.engine.state.terrains[newTerrainId].slots[this.owner].unit = this;
      this.terrainId = newTerrainId;

      this.engine.emitEvent({
        type: 'UNIT_DEPLOYED',
        unitId: this.id,
        unitName: this.name,
        terrainId: newTerrainId,
        playerId: this.owner,
      });
    }
  }
}
