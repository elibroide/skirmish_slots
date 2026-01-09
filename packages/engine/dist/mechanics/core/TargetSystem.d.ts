import type { SlotCoord } from '../../systems/rules/RuleTypes';
export interface TargetQuery {
    zone: 'SELF' | 'CLOSE' | 'IN_FRONT' | 'ALL' | 'EVENT';
    relationship?: 'ALLY' | 'ENEMY' | 'ANY';
    entity?: 'UNIT' | 'SLOT';
    properties?: Record<string, any>;
}
export type TargetType = 'SELF' | TargetQuery;
export interface DynamicValue {
    source: TargetType;
    property: string;
    multiplier?: number;
}
export type TargetDecision = 'PLAYER' | 'RANDOM' | 'ALL' | 'FIRST';
export interface TargetConfig {
    type: TargetType;
    decision?: TargetDecision;
    count?: number;
}
export interface TargetResult {
    slots: SlotCoord[];
    units: any[];
}
export declare class TargetSelector {
    private engine;
    private owner;
    constructor(engine: any, owner: any);
    getValidTargets(config: TargetConfig, context?: any): TargetResult;
    private getZoneTargets;
}
