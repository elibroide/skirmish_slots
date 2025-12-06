import { Effect } from './Effect';
import type { EffectResult, GameState, GameEvent } from '../types';
import { UnitCard } from '../cards/Card';

/**
 * Bounce a unit back to its owner's hand (keep for future use)
 */
export class BounceUnitEffect extends Effect {
  constructor(private unit: UnitCard) {
    super();
  }

  async execute(state: GameState): Promise<EffectResult> {
    const events: GameEvent[] = [];
    const terrainId = this.unit.terrainId;

    if (terrainId === null) {
      // Unit not on board, nothing to do
      return { newState: state, events };
    }

    const terrain = state.terrains[terrainId];
    const player = state.players[this.unit.owner];

    // Remove from terrain
    terrain.slots[this.unit.owner].unit = null;

    // Add to hand
    player.hand.push(this.unit);

    // Reset unit power to original
    this.unit.power = this.unit.originalPower;

    events.push({
      type: 'UNIT_BOUNCED' as const,
      unitId: this.unit.id,
      unitName: this.unit.name,
      terrainId,
      toHand: true,
    });

    // Clear unit's terrain reference
    this.unit.terrainId = null;

    return { newState: state, events };
  }
}
