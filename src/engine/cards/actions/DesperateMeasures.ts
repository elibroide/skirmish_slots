import { ActionCard } from '../Card';
import type { PlayerId, GameState, TargetInfo, TerrainId } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Desperate Measures
 * Lose a terrain (remove your unit). An ally gets +6.
 */
export class DesperateMeasures extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('desperate_measures', 'Desperate Measures', 'Lose a terrain (remove your unit). An ally gets +6.', owner, engine);
  }

  needsTarget(): boolean {
    return true;
  }

  getValidTargets(state: GameState): TargetInfo {
    // Need to target a terrain to lose and a unit to buff
    // For simplicity, just target a unit to buff (auto-select terrain)
    const allyUnits = this.engine.getPlayerUnits(this.owner);
    return {
      type: 'ally_unit',
      validUnitIds: allyUnits.map(u => u.id),
    };
  }

  play(targetUnitId?: unknown): void {
    if (typeof targetUnitId !== 'string') return;

    const targetUnit = this.engine.getUnitById(targetUnitId);
    if (!targetUnit || targetUnit.owner !== this.owner) return;

    // Find a terrain to lose (has your unit on it)
    const myUnits = this.engine.getPlayerUnits(this.owner);
    if (myUnits.length === 0) return;

    // Remove first unit from board (lose that terrain)
    const unitToRemove = myUnits[0];
    if (unitToRemove.terrainId !== null) {
      const terrain = this.engine.state.terrains[unitToRemove.terrainId];
      terrain.slots[this.owner].unit = null;

      // Add to graveyard
      this.engine.state.players[this.owner].graveyard.push(unitToRemove);
      unitToRemove.terrainId = null;

      this.engine.emitEvent({
        type: 'UNIT_DIED',
        unitId: unitToRemove.id,
        unitName: unitToRemove.name,
        terrainId: unitToRemove.terrainId,
        cause: 'desperate measures',
      });
    }

    // Give +6 to target ally
    targetUnit.addPower(6);
  }
}
