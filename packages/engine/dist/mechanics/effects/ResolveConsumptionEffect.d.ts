import { Effect } from './Effect';
import type { EffectResult, GameState } from '../../core/types';
import type { UnitCard } from '../cards/Card';
/**
 * Resolves the interaction between a consumed unit and its consumer.
 * Triggered after the victim has died and the consumer has been deployed.
 */
export declare class ResolveConsumptionEffect extends Effect {
    private victim;
    private consumer;
    constructor(victim: UnitCard, consumer: UnitCard);
    execute(state: GameState): Promise<EffectResult>;
}
