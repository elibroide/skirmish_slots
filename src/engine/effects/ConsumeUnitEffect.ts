import { Effect } from './Effect';
import type { EffectResult, GameState, GameEvent, PlayerSlotId } from '../types';
import { UnitCard } from '../cards/Card';

/**
 * Consume a unit (remove from board, add to graveyard, trigger onConsumed callback)
 * Renamed from "Sacrifice" - same mechanic, just different terminology
 */
export class ConsumeUnitEffect extends Effect {
  constructor(
    private unitId: string,  // Unit being consumed
    private consumingSourceId: string | null  // Unit/action doing the consuming (null if action)
  ) {
    super();
  }

  async execute(state: GameState): Promise<EffectResult> {
    const events: GameEvent[] = [];
    const unit = this.engine.getUnitById(this.unitId);

    if (!unit || unit.terrainId === null) {
      // Unit not on board, nothing to do
      return { newState: state, events };
    }

    const consumingUnit = this.consumingSourceId ? this.engine.getUnitById(this.consumingSourceId) : null;
    const terrain = state.terrains[unit.terrainId];
    const ownerId = unit.owner as PlayerSlotId;

    // Remove from terrain
    terrain.slots[ownerId].unit = null;

    // Add to graveyard
    const player = state.players[ownerId];
    player.graveyard.push(unit);

    // Trigger onConsumed callback if exists
    if ('onConsumed' in unit && typeof unit.onConsumed === 'function') {
      unit.onConsumed(consumingUnit);
    }

    events.push({
      type: 'UNIT_CONSUMED' as const,
      unitId: unit.id,
      unitName: unit.name,
      terrainId: unit.terrainId,
    });

    // Clear unit's terrain reference
    unit.terrainId = null;

    return { newState: state, events };
  }
}
