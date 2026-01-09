
export type TriggerType = 'Deploy' | 'Death' | 'TurnStart' | 'PlayCard' | 'TurnStarts' | string;

export type OperatorType = 'eq' | 'neq' | 'gt' | 'lt' | 'contains';

export type TargetStrategy = 'Self' | 'Relative' | 'RelativeToTrigger' | 'RelativeToIteration';
export type EntityType = 'Unit' | 'Slot';
export type ProximityType = 'Close' | 'Opposing' | 'All' | 'Self'; // Added Self for completeness in relative checks
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
  condition?: Condition | Condition[]; // Supports single or array based on examples
}

export type StrategyType = 'All' | 'Player' | 'Random';

export interface SelectionConfig {
  strategy: StrategyType;
  min?: number;
  max?: number;
}

export interface ActionConfig {
    type: string;
    value?: ValueSelector;
    
    // Specific params
    toSlot?: TargetSelector;
    opponent?: TargetSelector;
    effects?: EffectDefinition[]; // For Sequence: Recursive definition
    iteration?: 'ForEach' | 'Once';
    swap?: boolean;
}

export interface EffectDefinition {
    candidates?: TargetSelector; // If omitted? Default to Self or error? Let's make it optional but usually required.
    selection?: SelectionConfig;      
    action: ActionConfig;
}

export interface TriggerConfig {
  type: TriggerType;
  target?: TargetSelector;
  
  // Specific params
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
  effects: EffectDefinition[];
  limit?: LimitConfig;
}
