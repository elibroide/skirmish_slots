import { Effect } from './Effect';
import type { EffectResult, GameState, SlotId } from '../types';
import { UnitCard } from '../cards/Card';

/**
 * Deploy a unit to a slot
 */
export class DeployUnitEffect extends Effect {
  constructor(
    private unit: UnitCard,
    private slotId: SlotId
  ) {
    super();
  }

  execute(state: GameState): EffectResult {
    const events = [];
    const slot = state.slots[this.slotId];

    // Place unit
    slot.units[this.unit.owner] = this.unit;
    this.unit.slotId = this.slotId;

    events.push({
      type: 'UNIT_DEPLOYED' as const,
      unitId: this.unit.id,
      unitName: this.unit.name,
      slotId: this.slotId,
      playerId: this.unit.owner,
    });

    // Trigger slot ongoing effects (only for this player's effects)
    const deployEffects = slot.ongoingEffects.filter(
      (e) => e.owner === this.unit.owner && e.trigger === 'deploy'
    );

    for (const effect of deployEffects) {
      effect.apply(this.unit);
    }

    // Trigger unit's onDeploy hook
    this.unit.onDeploy();

    return { newState: state, events };
  }
}
