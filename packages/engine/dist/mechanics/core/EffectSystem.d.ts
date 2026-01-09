import type { SlotCoord } from '../../systems/rules/RuleTypes';
import type { GameEngine } from '../../core/GameEngine';
import type { UnitCard } from '../cards/Card';
export type EffectType = 'DEAL_DAMAGE' | 'ADD_POWER' | 'SET_POWER' | 'DRAW_CARDS' | 'ADD_SLOT_MODIFIER' | 'KILL' | 'CLEANSE' | 'DEPLOY_UNIT' | 'REMOVE_SLOT_MODIFIER' | 'ADD_SHIELD' | 'BOUNCE' | 'HEAL' | 'CREATE_CARD' | 'MOVE_UNIT' | string;
export interface EffectConfig {
    type: EffectType;
    value?: number | string | ((context: any) => number | string);
    target?: string;
    condition?: (target: any) => boolean;
}
export type EffectHandler = (config: EffectConfig, target: {
    slots: SlotCoord[];
}, context: any, engine: GameEngine, owner: UnitCard) => Promise<any[]>;
export declare class EffectExecutor {
    private engine;
    private owner;
    private handlers;
    constructor(engine: GameEngine, owner: UnitCard);
    registerHandler(type: string, handler: EffectHandler): void;
    execute(config: EffectConfig, target: {
        slots: SlotCoord[];
    }, context: any): Promise<any[]>;
    private resolveTargets;
    private resolveValue;
    private registerDefaultEffects;
}
