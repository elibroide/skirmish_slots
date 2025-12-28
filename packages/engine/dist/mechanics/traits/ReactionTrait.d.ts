import { Trait } from './Trait';
import type { UnitCard } from '../cards/Card';
export type TriggerType = 'ON_DEPLOY' | 'ON_DEATH' | 'ON_CONQUER' | 'ON_CONSUME' | 'ON_CONSUMED';
export type TargetType = 'SELF' | 'CLOSE_ALLY' | 'CLOSE_ENEMY' | 'CLOSE_ANY' | 'IN_FRONT' | 'ALL_ENEMIES' | 'SLOT' | 'CLOSE_ALLY_SLOT' | 'CONSUMING_UNIT' | 'CONSUMED_UNIT';
export type TargetDecision = 'PLAYER' | 'RANDOM' | 'ALL' | 'FIRST';
export type EffectType = 'DEAL_DAMAGE' | 'ADD_POWER' | 'SET_POWER' | 'DRAW_CARDS' | 'ADD_SLOT_MODIFIER' | 'KILL' | 'CLEANSE' | 'DEPLOY_UNIT' | 'REMOVE_SLOT_MODIFIER' | 'ADD_SHIELD';
export interface ReactionEffectConfig {
    target?: TargetType;
    targetDecision?: TargetDecision;
    effect: EffectType;
    value: number | string | ((context: any) => number | string);
    condition?: (target: any) => boolean;
}
export interface ReactionConfig {
    trigger: TriggerType;
    target?: TargetType;
    targetDecision?: TargetDecision;
    effect?: EffectType;
    value?: number | string | ((context: any) => number | string);
    condition?: (target: any) => boolean;
    effects?: ReactionEffectConfig[];
}
/**
 * ReactionTrait handles one-time lifecycle triggers
 * Examples: Deploy, Death, Conquer, Consume, Consumed
 */
export declare class ReactionTrait extends Trait {
    private config;
    constructor(config: ReactionConfig, owner?: UnitCard);
    onDeploy(): Promise<void>;
    onDeath(): Promise<void>;
    onConquer(): Promise<void>;
    onConsume(victim: UnitCard): void;
    onConsumed(consumingUnit: UnitCard | null): void;
    private executeReaction;
    private executeReactionWithContext;
    private executeMultipleEffects;
    private getTargetsForEffect;
    private getTargetTypeForEffectInput;
    private applyEffectFromConfig;
    private getTargets;
    private unitsToSlotCoords;
    private getTargetTypeForInput;
    private applyEffect;
}
