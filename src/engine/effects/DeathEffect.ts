import { Effect } from './Effect';
import type { EffectResult, GameState, GameEvent } from '../types';
import { UnitCard } from '../cards/Card';

/**
 * Handle unit death (power <= 0)
 */
export class DeathEffect extends Effect {
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

    // Remove from slot
    slot.units[this.unit.owner] = null;

    // Add to discard
    const player = state.players[this.unit.owner];
    player.discard.push(this.unit);

    events.push({
      type: 'UNIT_DIED' as const,
      unitId: this.unit.id,
      unitName: this.unit.name,
      slotId,
      cause: 'death',
    });

    // Trigger death effects
    this.unit.onDeath();

    // Clear unit's slot reference
    this.unit.slotId = null;

    return { newState: state, events };
  }
}
