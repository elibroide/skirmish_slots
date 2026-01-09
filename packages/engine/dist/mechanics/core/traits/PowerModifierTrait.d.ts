import { ContinuousTrait } from '../ContinuousTrait';
import type { UnitCard } from '../../cards/Card';
export type TargetType = 'SELF' | 'CLOSE_ALLY' | 'CLOSE_ENEMY' | 'ALL_ENEMIES';
export interface PowerModifierConfig {
    target: TargetType;
    value: number;
    condition?: (target: UnitCard) => boolean;
}
/**
 * PowerModifierTrait
 * A specific passive trait that modifies the power of targets using the Rule System.
 */
export declare class PowerModifierTrait extends ContinuousTrait {
    private config;
    constructor(config: PowerModifierConfig, owner?: UnitCard);
    protected register(): void;
    private matchesTarget;
    private isClose;
}
