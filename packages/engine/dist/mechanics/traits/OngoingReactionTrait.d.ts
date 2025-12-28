import { Trait } from './Trait';
import type { UnitCard } from '../cards/Card';
import type { GameEvent } from '../../core/types';
export type OngoingTrigger = 'UNIT_DIED' | 'UNIT_DAMAGED' | 'UNIT_DEPLOYED' | 'UNIT_POWER_CHANGED' | 'UNIT_HEALED' | 'UNIT_CONSUMED' | 'UNIT_BOUNCED' | 'CARD_PLAYED' | 'CARD_DRAWN' | 'TURN_CHANGED' | 'YOUR_TURN_START' | 'YOUR_TURN_ENDS' | 'OPPONENT_TURN_START' | 'ROUND_STARTED' | 'SKIRMISH_STARTED' | 'SKIRMISH_ENDED' | 'TERRAIN_RESOLVED' | 'ABILITY_ACTIVATED';
export type ProximityType = 'CLOSE' | 'IN_FRONT' | 'SAME_TERRAIN';
export type OngoingTargetType = 'SELF' | 'CLOSE_ALLY' | 'CLOSE_ENEMY' | 'EVENT_SOURCE';
export type OngoingEffectType = 'ADD_POWER' | 'DEAL_DAMAGE' | 'ADD_SLOT_MODIFIER' | 'BOUNCE' | 'MOVE' | 'HEAL' | 'CREATE_CARDS';
export interface OngoingEffectConfig {
    target?: OngoingTargetType;
    targetDecision?: 'ALL' | 'SELF' | 'RANDOM';
    effect: OngoingEffectType;
    value: number | string | ((event: GameEvent) => number | string);
}
export interface OngoingReactionConfig {
    listenTo: OngoingTrigger;
    proximity?: ProximityType;
    filter?: (event: GameEvent, owner: UnitCard) => boolean;
    target?: OngoingTargetType;
    targetDecision?: 'ALL' | 'SELF' | 'RANDOM';
    effect?: OngoingEffectType;
    value?: number | string | ((event: GameEvent) => number | string);
    effects?: OngoingEffectConfig[];
}
/**
 * OngoingReactionTrait handles continuous event-based triggers
 * Examples: "When a unit dies", "When damage is dealt", "When turn starts"
 */
export declare class OngoingReactionTrait extends Trait {
    private config;
    private unsubscribe?;
    constructor(config: OngoingReactionConfig, owner?: UnitCard);
    onAttach(card: UnitCard): void;
    onDeploy(): Promise<void>;
    onLeave(): void;
    onDetach(): void;
    private handleEvent;
    private checkProximity;
    private executeReaction;
    private applyReaction;
    private applyEffectConfig;
    private applyEffect;
}
