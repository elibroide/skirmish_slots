import type { GameEvent } from '../../core/types';
import type { UnitCard } from '../cards/Card';
import type { TargetQuery } from './TargetSystem';
export type TriggerType = 'ON_DEPLOY' | 'ON_DEATH' | 'ON_CONQUER' | 'ON_CONSUME' | 'ON_CONSUMED' | string | TriggerObjectConfig;
export interface TriggerContext {
    unit?: any;
    victim?: any;
    consumingUnit?: any;
}
export interface TriggerObjectConfig {
    type: TriggerType;
    filter?: TargetQuery;
}
export interface TriggerDefinition {
    listenTo: string[];
    matches: (event: GameEvent, owner: UnitCard, context?: any) => boolean;
}
export declare class TriggerRegistry {
    private static definitions;
    static register(name: string, definition: TriggerDefinition): void;
    static get(name: string): TriggerDefinition | undefined;
}
