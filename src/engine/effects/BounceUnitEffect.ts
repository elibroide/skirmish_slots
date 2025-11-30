import { Effect } from './Effect';
import type { EffectResult, GameState, GameEvent } from '../types';
import { UnitCard } from '../cards/Card';

/**
 * Bounce a unit back to its owner's hand
 */
export class BounceUnitEffect extends Effect {
  constructor(private unit: UnitCard) {
    super();
  }

  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];
    const slotId = this.unit.slotId;

    if (slotId === null) {
      // Unit not on board, nothing to do
      return { newState: state, events };
    }

    const slot = state.slots[slotId];
    const player = state.players[this.unit.owner];

    // Remove from slot
    slot.units[this.unit.owner] = null;

    // Add to hand
    player.hand.push(this.unit);

    // Reset unit power to original
    this.unit.power = this.unit.originalPower;

    events.push({
      type: 'UNIT_BOUNCED' as const,
      unitId: this.unit.id,
      unitName: this.unit.name,
      slotId,
      toHand: true,
    });

    // Clear unit's slot reference
    this.unit.slotId = null;

    return { newState: state, events };
  }
}
