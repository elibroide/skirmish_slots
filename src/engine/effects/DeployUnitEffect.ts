import { Effect } from './Effect';
import type { EffectResult, GameState, TerrainId } from '../types';
import { UnitCard } from '../cards/Card';

/**
 * Deploy a unit to a terrain
 */
export class DeployUnitEffect extends Effect {
  constructor(
    private unit: UnitCard,
    private terrainId: TerrainId
  ) {
    super();
  }

  async execute(state: GameState): Promise<EffectResult> {
    const events = [];
    const terrain = state.terrains[this.terrainId];

    // Place unit in player's slot on this terrain
    terrain.slots[this.unit.owner].unit = this.unit;
    this.unit.terrainId = this.terrainId;

    events.push({
      type: 'UNIT_DEPLOYED' as const,
      unitId: this.unit.id,
      unitName: this.unit.name,
      terrainId: this.terrainId,
      playerId: this.unit.owner,
    });

    // Trigger unit's onDeploy hook (await it - may request player input)
    await this.unit.onDeploy();

    return { newState: state, events };
  }
}
