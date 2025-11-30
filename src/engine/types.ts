// Core game types for Skirmish card game

// Player identifiers
export type PlayerId = 0 | 1;

// Slot identifiers (0-3 for 4 slots)
export type SlotId = 0 | 1 | 2 | 3;

// Forward declaration - actual classes defined in cards/Card.ts
// Using 'any' here to avoid circular dependency issues
export type Card = any;
export type UnitCard = any;

// Ongoing slot effect
export interface SlotEffect {
  id: string;
  owner: PlayerId;
  description: string;
  trigger: 'deploy' | 'continuous';
  // Effect function will be applied by the actual card implementation
  apply: (unit: any) => void;
}

// Individual slot state
export interface Slot {
  units: [UnitCard | null, UnitCard | null]; // [player0, player1]
  ongoingEffects: SlotEffect[];
  winner: PlayerId | null;
}

// Player state
export interface Player {
  id: PlayerId;
  hand: Card[];
  deck: Card[];
  discard: Card[];
  vp: number;
  roundsWon: number;
}

// Complete game state
export interface GameState {
  players: [Player, Player];
  slots: [Slot, Slot, Slot, Slot];
  currentRound: number;
  currentPlayer: PlayerId;
  hasPassed: [boolean, boolean];
  tieRounds: number;
  matchWinner: PlayerId | null | undefined; // null = draw, undefined = ongoing
}

// Game actions (player inputs)
export type GameAction =
  | {
      type: 'PLAY_CARD';
      playerId: PlayerId;
      cardId: string; // Instance ID of card
      slotId?: SlotId; // For units
      targetUnitId?: string; // For targeted effects
      targetSlotId?: SlotId; // For slot-targeted effects
    }
  | {
      type: 'PASS';
      playerId: PlayerId;
    };

// Game events (emitted by engine)
export type GameEvent =
  // Card events
  | { type: 'CARD_PLAYED'; playerId: PlayerId; cardId: string; cardName: string; slotId?: SlotId }
  | { type: 'CARD_DRAWN'; playerId: PlayerId; cardId: string; cardName: string }
  | { type: 'CARD_DISCARDED'; playerId: PlayerId; cardId: string; cardName: string }

  // Unit events
  | { type: 'UNIT_DEPLOYED'; unitId: string; unitName: string; slotId: SlotId; playerId: PlayerId }
  | { type: 'UNIT_DIED'; unitId: string; unitName: string; slotId: SlotId; cause: string }
  | { type: 'UNIT_SACRIFICED'; unitId: string; unitName: string; slotId: SlotId }
  | { type: 'UNIT_BOUNCED'; unitId: string; unitName: string; slotId: SlotId; toHand: boolean }
  | { type: 'UNIT_POWER_CHANGED'; unitId: string; slotId: SlotId; oldPower: number; newPower: number; amount: number }
  | { type: 'UNIT_DAMAGED'; unitId: string; slotId: SlotId; amount: number; newPower: number }
  | { type: 'UNIT_HEALED'; unitId: string; slotId: SlotId; amount: number; newPower: number }

  // Slot events
  | { type: 'SLOT_EFFECT_ADDED'; slotId: SlotId; effectId: string; description: string; owner: PlayerId }
  | { type: 'SLOT_EFFECT_REMOVED'; slotId: SlotId; effectId: string }
  | { type: 'SLOT_RESOLVED'; slotId: SlotId; winner: PlayerId | null; unit0Power: number; unit1Power: number }

  // Round events
  | { type: 'ROUND_STARTED'; roundNumber: number }
  | { type: 'ROUND_ENDED'; roundNumber: number; winner: PlayerId | null; vp: [number, number] }
  | { type: 'PLAYER_PASSED'; playerId: PlayerId }
  | { type: 'CONQUER_TRIGGERED'; unitId: string; slotId: SlotId }
  | { type: 'PRIORITY_CHANGED'; newPriority: PlayerId }

  // Match events
  | { type: 'MATCH_ENDED'; winner: PlayerId | null }

  // State snapshot (sent after every action)
  | { type: 'STATE_SNAPSHOT'; state: GameState };

// Targeting information for cards that need targets
export type TargetInfo =
  | { type: 'none' }
  | { type: 'unit'; validUnitIds: string[] }
  | { type: 'slot'; validSlotIds: SlotId[] }
  | { type: 'enemy_unit'; validUnitIds: string[] }
  | { type: 'ally_unit'; validUnitIds: string[] }
  | { type: 'close_unit'; validUnitIds: string[] }
  | { type: 'far_unit'; validUnitIds: string[] };

// Result of effect execution
export interface EffectResult {
  newState: GameState;
  events: GameEvent[];
}
