import { Effect } from './Effect';
/**
 * Resolves the interaction between a consumed unit and its consumer.
 * Triggered after the victim has died and the consumer has been deployed.
 */
export class ResolveConsumptionEffect extends Effect {
    constructor(victim, consumer) {
        super();
        Object.defineProperty(this, "victim", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: victim
        });
        Object.defineProperty(this, "consumer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: consumer
        });
    }
    async execute(state) {
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
