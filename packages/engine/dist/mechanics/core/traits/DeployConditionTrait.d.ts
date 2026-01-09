import { Trait } from '../Trait';
import type { UnitCard } from '../../cards/Card';
export type DeployConditionType = 'MUST_CONSUME_UNIT';
export type ValidTargetType = 'ALLIES' | 'ENEMIES' | 'ANY';
export interface DeployConditionConfig {
    condition: DeployConditionType;
    validTargets?: ValidTargetType;
}
/**
 * DeployConditionTrait modifies deployment targeting rules
 * Used for cards like Dragon that can only be deployed under specific conditions
 */
export declare class DeployConditionTrait extends Trait {
    private config;
    constructor(config: DeployConditionConfig, owner?: UnitCard);
    /**
     * Override the unit's getValidTargets method when attached
     */
    onAttach(card: UnitCard): void;
    /**
     * Get valid targets when unit must consume another unit
     */
    private getMustConsumeTargets;
}
