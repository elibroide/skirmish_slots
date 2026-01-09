import type { Card } from '../../mechanics/cards/Card';
import type { PlayerId, TerrainId } from '../../core/types';
import type { UnitCard } from '../../mechanics/cards/Card';

export enum RuleType {
  CAN_DEPLOY = 'CAN_DEPLOY',
  CAN_TARGET = 'CAN_TARGET',
  CAN_CONSUME = 'CAN_CONSUME',
  DETERMINE_TERRAIN_WINNER = 'DETERMINE_TERRAIN_WINNER',
  MODIFY_POWER = 'MODIFY_POWER',
}

export interface SlotCoord {
  terrainId: TerrainId;
  playerId: PlayerId;
}

export interface DeploymentContext {
  deployingCard: Card;
  targetSlot: SlotCoord;
  targetUnitId?: string; // Optional: ID of unit at the target slot
}

export interface TargetingContext {
  sourceCard: Card;
  targetSlot: SlotCoord;
}

export interface ConsumeContext {
  consumerUnit: UnitCard;
  targetUnit: UnitCard;
}

export interface TerrainResolutionContext {
  terrainId: TerrainId;
  power0: number;
  power1: number;
}

export interface PowerModificationContext {
  unit: UnitCard;
}

export type RuleContext = DeploymentContext | TargetingContext | ConsumeContext | TerrainResolutionContext | PowerModificationContext;

export type RuleModifier<T = boolean> = (context: RuleContext, currentResult: T) => T;
