import type { GameEntity } from '../../../entities/base/GameEntity';
import type { TargetSelector } from '../react/ReactTypes';
import type { TriggerConfig } from '../react/ReactTypes'; 
import type { UnitCard } from '../../cards/Card';

export type ModifierType = 
    | 'BuffPower' 
    | 'BuffShield' 
    | 'SetPower' 
    | 'GrantTrait'
    | 'AddDeploymentRule'
    | 'SetWinCondition';

export interface ModifierConfig {
    type: ModifierType;
    target: TargetSelector;
    value?: any; 
    trait?: any; 
    condition?: any; 
}

export interface ModifierContext {
    source: UnitCard; // The unit providing the passive
    engine: any;
}

/**
 * Abstract base class for all Modifiers.
 * Modifiers are state-based changes applied by PassiveTraits.
 */
export abstract class Modifier {
    constructor(protected config: ModifierConfig) {}

    abstract get type(): ModifierType;

    /**
     * Apply the modification to the target.
     * @param target The entity receiving the modifier
     * @param context Context providing source and engine access
     */
    abstract apply(target: GameEntity, context: ModifierContext): void;

    /**
     * Remove the modification from the target.
     * @param target The entity losing the modifier
     * @param context Context providing source and engine access
     */
    abstract remove(target: GameEntity, context: ModifierContext): void;
}
