// Basic scalar types
export type PlayerId = 0 | 1;
export type TerrainId = 0 | 1 | 2 | 3 | 4;
export type PlayerSlotId = 0 | 1;

export interface SlotCoord {
  terrainId: TerrainId;
  playerId: PlayerId;
}

export type InputRequest = 
  | { type: 'target'; targetType: string; context: string; validTargetIds?: string[]; validSlots?: SlotCoord[] }
  | { type: 'choose_option'; options: string[]; context: string };

// Card types (minimal)
// Note: We avoid importing Card/UnitCard classes here to prevent cycles
// Use string IDs for state references

// Game State Types
export interface SlotState {
  unit: any | null; // Avoid circular dependency with UnitCard
  modifier: number; // e.g. +1 power to this slot
}

export interface TerrainState {
  id: TerrainId;
  slots: {
    0: SlotState;
    1: SlotState;
  };
  winner: PlayerId | null; // null = draw/ongoing
}

export interface PlayerState {
  id: PlayerId;
  hand: any[]; // Card[]
  deck: any[]; // Card[]`
  graveyard: any[]; // Card[]
  sp: number; // Skirmish Points
  skirmishesWon: number;
}

// Leader System Types
export interface LeaderDefinition {
  leaderId: string;           // Unique identifier (e.g., "warlord", "sage")
  name: string;               // Display name
  maxCharges: number;         // Maximum charges (0 for no ability)
  abilityDescription: string; // Human-readable ability text
}

export interface LeaderState {
  leaderId: string;           // Which leader this player is using
  currentCharges: number;     // Remaining charges
  isExhausted: boolean;       // Cannot use ability this skirmish (future use)
}

export interface GameState {
  players: [PlayerState, PlayerState];
  terrains: [
    TerrainState,
    TerrainState,
    TerrainState,
    TerrainState,
    TerrainState
  ];
  leaders: [LeaderState, LeaderState]; // One per player
  currentSkirmish: number;
  currentTurn: number;                  // Increments each time a player passes
  currentPlayer: PlayerId;
  isDone: [boolean, boolean];           // Player locked out for skirmish
  hasActedThisTurn: [boolean, boolean]; // Did player take action this turn?
  hasPlayedCardThisTurn: [boolean, boolean]; // Did player play a card this turn? (limit 1)
  tieSkirmishes: number;
  matchWinner?: PlayerId;
}

// Game Actions (Player -> Engine)
export type GameAction =
  | {
      type: 'PLAY_CARD';
      playerId: PlayerId;
      cardId: string;
      targetSlot?: SlotCoord;
      checksum?: string; // For network sync verification
    }
  | {
      type: 'ACTIVATE';
      playerId: PlayerId;
      unitId: string;
      checksum?: string;
    }
  | {
      type: 'PASS';
      playerId: PlayerId;
      checksum?: string;
    }
  | {
      type: 'INPUT';
      playerId: PlayerId;
      input: any;
      checksum?: string;
    }
  | {
      type: 'ACTIVATE_LEADER';
      playerId: PlayerId;
      checksum?: string;
    };

// Game Events (Engine -> UI/Controllers)
export type GameEvent =
  | { type: 'CARD_PLAYED'; playerId: PlayerId; cardId: string; cardName: string; cardType: 'unit' | 'action'; targetSlot?: SlotCoord }
  | { type: 'UNIT_DEPLOYED'; unitId: string; unitName: string; terrainId: TerrainId; playerId: PlayerId }
  | { type: 'UNIT_DIED'; unitId: string; unitName: string; terrainId: TerrainId; cause: string }
  | { type: 'UNIT_POWER_CHANGED'; unitId: string; terrainId: TerrainId; oldPower: number; newPower: number; amount: number }
  | { type: 'UNIT_DAMAGED'; unitId: string; terrainId: TerrainId; amount: number; newPower: number }
  | { type: 'UNIT_HEALED'; unitId: string; terrainId: TerrainId; amount: number; newPower: number }
  | { type: 'UNIT_CONSUMED'; unitId: string; unitName: string; terrainId: TerrainId }
  | { type: 'UNIT_BOUNCED'; unitId: string; unitName: string; terrainId: TerrainId; toHand: boolean }
  | { type: 'UNIT_MOVED'; unitId: string; fromTerrainId: TerrainId; toTerrainId: TerrainId; playerId: PlayerId }
  | { type: 'SLOT_MODIFIER_CHANGED'; terrainId: TerrainId; playerId: PlayerId; newModifier: number }
  | { type: 'CARD_DRAWN'; playerId: PlayerId; count: number; cardId?: string }
  | { type: 'CARD_DISCARDED'; playerId: PlayerId; cardId: string; cardName?: string }
  | { type: 'TURN_CHANGED'; playerId: PlayerId }
  | { type: 'ROUND_STARTED'; roundNumber: number }
  | { type: 'SKIRMISH_STARTED'; skirmishNumber: number }
  | { type: 'TERRAIN_RESOLVED'; terrainId: TerrainId; winner: PlayerId | null; unit0Power: number; unit1Power: number }
  | { type: 'CONQUER_TRIGGERED'; unitId: string; terrainId: TerrainId; slotId?: number } // slotId legacy support
  | { type: 'SKIRMISH_ENDED'; skirmishNumber: number; winner: PlayerId | null; sp: [number, number] }
  | { type: 'MATCH_ENDED'; winner: PlayerId }
  | { type: 'ACTION_REQUIRED'; playerId: PlayerId }
  | { type: 'INPUT_REQUIRED'; playerId: PlayerId; inputRequest: InputRequest }
  | { type: 'PRIORITY_CHANGED'; newPriority: PlayerId }
  | { type: 'ABILITY_ACTIVATED'; unitId: string; abilityName: string }
  | { type: 'ABILITY_TRIGGERED'; playerId: PlayerId; cardId: string; cardName: string; abilityName: string }
  | { type: 'COOLDOWN_REDUCED'; unitId: string; newCooldown: number }
  | { type: 'PLAYER_PASSED'; playerId: PlayerId; isDone: boolean }
  | { type: 'STATE_SNAPSHOT'; state: GameState }
  | { type: 'ACTION_EXECUTED'; action: GameAction } // For network sync
  | { type: 'LEADER_ABILITY_ACTIVATED'; playerId: PlayerId; leaderId: string; abilityName: string; chargesRemaining: number }
  | { type: 'LEADER_CHARGES_CHANGED'; playerId: PlayerId; oldCharges: number; newCharges: number }
  // Legacy/Migration types (to satisfy old code if needed)
  | { type: 'ROUND_ENDED'; roundNumber: number; winner: PlayerId | null; vp: [number, number] }
  | { type: 'SLOT_RESOLVED'; slotId: number; winner: PlayerId | null; unit0Power: number; unit1Power: number }
  | { type: 'TARGET_REQUIRED'; playerId: PlayerId } // Legacy target request
  ;

export interface EffectResult {
  newState: GameState;
  events: GameEvent[];
}

// Targeting information
export type TargetInfo =
  | { type: 'none' }
  | { type: 'slots'; validSlots: SlotCoord[] };

export interface Card {
    id: string;
    cardId: string;
    name: string;
    description: string;
    owner: PlayerId;
    getType(): 'unit' | 'action';
    needsTarget(): boolean;
}

export interface UnitCard extends Card {
  power: number;
  originalPower: number;
  shield: number;
  terrainId: TerrainId | null;
  canActivate(): boolean;
  requestInput(request: InputRequest): Promise<any>;
}

// Game Logging Types
export interface PlayerInfo {
  id: PlayerId;
  name: string;
  type: 'human' | 'ai';
}

export interface SimplifiedGameState {
  currentSkirmish: number;
  currentPlayer: PlayerId;
  scores: {
    player0: { sp: number; skirmishesWon: number };
    player1: { sp: number; skirmishesWon: number };
  };
  terrains: Array<{
    id: TerrainId;
    winner: PlayerId | null;
    units: [
      { name: string; power: number } | null,
      { name: string; power: number } | null
    ];
  }>;
  handSizes: [number, number];
  deckSizes: [number, number];
}

export interface GameLogEntry {
  turn: number;
  player: PlayerId;
  playerType: 'human' | 'ai';
  actionType: string;
  details: any;
  reasoning: string | null;
  timestamp: string;
  gameStateSnapshot: SimplifiedGameState;
}

export interface GameResult {
  winner: PlayerId | null;
  finalScore: [number, number];
  totalTurns: number;
}

export interface GameLog {
  gameId: string;
  timestamp: string;
  players: [PlayerInfo, PlayerInfo];
  result: GameResult | null;
  actions: GameLogEntry[];
}
