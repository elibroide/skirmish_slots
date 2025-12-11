import { Effect } from './Effect';
import type { EffectResult, GameState, GameEvent } from '../types';
import type { UnitCard } from '../cards/Card';

/**
 * Resolves the interaction between a consumed unit and its consumer.
 * Triggered after the victim has died and the consumer has been deployed.
 */
export class ResolveConsumptionEffect extends Effect {
  constructor(
    private victim: UnitCard,
    private consumer: UnitCard
  ) {
    super();
  }

  async execute(state: GameState): Promise<EffectResult> {
    // 1. Trigger victim's onConsumed (e.g. Acolyte buffs consumer)
    if ('onConsumed' in this.victim && typeof this.victim.onConsumed === 'function') {
      await this.victim.onConsumed(this.consumer);
    }

    // 2. Trigger consumer's onConsume (e.g. Warlock uses victim's power)
    if ('onConsume' in this.consumer && typeof this.consumer.onConsume === 'function') {
      await this.consumer.onConsume(this.victim);
    }

    return { newState: state, events: [] };
  }
}

