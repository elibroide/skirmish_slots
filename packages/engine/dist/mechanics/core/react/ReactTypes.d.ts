export type TriggerType = 'Deploy' | 'Death' | 'TurnStart' | 'PlayCard' | 'TurnStarts' | string;
export type OperatorType = 'eq' | 'neq' | 'gt' | 'lt' | 'contains';
export type TargetStrategy = 'Self' | 'Relative' | 'Inherited' | 'RelativeToTrigger';
export type EntityType = 'Unit' | 'Slot';
export type ProximityType = 'Close' | 'Opposing' | 'All' | 'Self';
export type RelationType = 'Ally' | 'Enemy' | 'None';
export type SelectionType = 'All' | 'Player' | 'Random';
export type ValueSource = 'static' | 'target' | 'me';
export interface ValueSelector {
    type: ValueSource;
    value: any;
    target?: TargetSelector;
}
export interface Condition {
    target?: TargetSelector;
    path: string;
    condition: OperatorType;
    value: ValueSelector;
}
export interface TargetSelector {
    type: TargetStrategy;
    entity?: EntityType;
    proximity?: ProximityType;
    relationship?: RelationType;
    multipleChoice?: SelectionType;
    condition?: Condition | Condition[];
}
export interface EffectConfig {
    type: string;
    target: TargetSelector;
    value?: ValueSelector;
    toSlot?: TargetSelector;
    opponent?: TargetSelector;
    effects?: EffectConfig[];
    iteration?: 'ForEach' | 'Once';
    swap?: boolean;
}
export interface TriggerConfig {
    type: TriggerType;
    target?: TargetSelector;
    cardType?: string;
}
export type LimitScope = 'Turn' | 'Round' | 'Game';
export interface LimitConfig {
    scope: LimitScope;
    max: number;
}
export interface ReactionConfig {
    triggers: TriggerConfig[];
    conditions?: Condition[];
    effects: EffectConfig[];
    limit?: LimitConfig;
}
