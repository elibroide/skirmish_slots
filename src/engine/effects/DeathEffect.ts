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

  async execute(state: GameState): Promise<EffectResult> {
    const events: GameEvent[] = [];
    const terrainId = this.unit.terrainId;

    if (terrainId === null) {
      // Unit not on board, nothing to do
      return { newState: state, events };
    }

    const terrain = state.terrains[terrainId];

    // Remove from terrain slot
    terrain.slots[this.unit.owner].unit = null;

    // Add to graveyard
    const player = state.players[this.unit.owner];
    player.graveyard.push(this.unit);

    events.push({
      type: 'UNIT_DIED' as const,
      unitId: this.unit.id,
      unitName: this.unit.name,
      terrainId,
      cause: 'death',
    });

    // Trigger death effects (await it - may request player input)
    await this.unit.onDeath();

    // Clear unit's terrain reference
    this.unit.terrainId = null;

    return { newState: state, events };
  }
}
