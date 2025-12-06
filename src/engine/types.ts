// Core game types for Skirmish card game

// Player identifiers
export type PlayerId = 0 | 1;

// Terrain identifiers (0-4 for 5 terrains)
export type TerrainId = 0 | 1 | 2 | 3 | 4;

// Player slot identifiers (each terrain has 2 slots, one per player)
export type PlayerSlotId = 0 | 1;

// Forward declaration - actual classes defined in cards/Card.ts
// Using 'any' here to avoid circular dependency issues
export type Card = any;
export type UnitCard = any;

// Player slot with modifier (clears each skirmish)
export interface PlayerSlot {
  unit: UnitCard | null;
  modifier: number;  // Simple numeric modifier (per-player slot), clears at skirmish end
}

// Terrain structure (each terrain has 2 slots, one per player)
export interface Terrain {
  slots: {
    0: PlayerSlot;  // Player 0's slot
    1: PlayerSlot;  // Player 1's slot
  };
  winner: PlayerId | null;
}

// Player state
export interface Player {
  id: PlayerId;
  hand: Card[];
  deck: Card[];
  graveyard: Card[];  // Face-up graveyard (replaces "discard")
  sp: number;  // Skirmish Points (replaces "vp")
  skirmishesWon: number;  // Replaces "roundsWon"
}

// Complete game state
export interface GameState {
  players: [Player, Player];
  terrains: [Terrain, Terrain, Terrain, Terrain, Terrain];  // 5 terrains
  currentSkirmish: number;  // Replaces "currentRound"
  currentPlayer: PlayerId;
  isDone: [boolean, boolean];  // Replaces "hasPassed"
  tieSkirmishes: number;  // Replaces "tieRounds"
  matchWinner: PlayerId | null | undefined; // null = draw, undefined = ongoing
}

// Input request types (for cards that need player input mid-execution)
export type InputRequest =
  | {
      type: 'target';
      targetType: 'unit' | 'enemy_unit' | 'ally_unit' | 'close_unit' | 'terrain';
      validTargetIds: string[];  // Unit IDs or terrain IDs (as strings)
      context: string;  // Description of what needs targeting (e.g., "Archer Deploy ability")
    }
  | {
      type: 'modal_choice';
      choices: string[];  // Array of choice descriptions
      context: string;
    };
  // Future input types can be added here (number selection, yes/no, etc.)

// Game actions (player inputs)
export type GameAction =
  | {
      type: 'PLAY_CARD';
      playerId: PlayerId;
      cardId: string; // Instance ID of card
      terrainId?: TerrainId; // For units (replaces slotId)
      targetUnitId?: string; // For targeted effects
      targetTerrainId?: TerrainId; // For terrain-targeted effects
    }
  | {
      type: 'ACTIVATE';
      playerId: PlayerId;
      unitId: string;  // Unit with Activate ability
    }
  | {
      type: 'DONE';  // Replaces 'PASS'
      playerId: PlayerId;
    };

// Game events (emitted by engine)
export type GameEvent =
  // Card events
  | { type: 'CARD_PLAYED'; playerId: PlayerId; cardId: string; cardName: string; terrainId?: TerrainId }
  | { type: 'CARD_DRAWN'; playerId: PlayerId; cardId: string; cardName: string }
  | { type: 'CARD_DISCARDED'; playerId: PlayerId; cardId: string; cardName: string }

  // Unit events
  | { type: 'UNIT_DEPLOYED'; unitId: string; unitName: string; terrainId: TerrainId; playerId: PlayerId }
  | { type: 'UNIT_DIED'; unitId: string; unitName: string; terrainId: TerrainId; cause: string }
  | { type: 'UNIT_CONSUMED'; unitId: string; unitName: string; terrainId: TerrainId }  // Replaces UNIT_SACRIFICED
  | { type: 'UNIT_BOUNCED'; unitId: string; unitName: string; terrainId: TerrainId; toHand: boolean }  // Keep for future
  | { type: 'UNIT_POWER_CHANGED'; unitId: string; terrainId: TerrainId; oldPower: number; newPower: number; amount: number }
  | { type: 'UNIT_DAMAGED'; unitId: string; terrainId: TerrainId; amount: number; newPower: number }
  | { type: 'UNIT_HEALED'; unitId: string; terrainId: TerrainId; amount: number; newPower: number }  // Keep for future

  // Terrain/Slot events
  | { type: 'SLOT_MODIFIER_CHANGED'; terrainId: TerrainId; playerId: PlayerId; newModifier: number }
  | { type: 'TERRAIN_RESOLVED'; terrainId: TerrainId; winner: PlayerId | null; unit0Power: number; unit1Power: number }

  // Skirmish events (replaces Round events)
  | { type: 'SKIRMISH_STARTED'; skirmishNumber: number }
  | { type: 'SKIRMISH_ENDED'; skirmishNumber: number; winner: PlayerId | null; sp: [number, number] }
  | { type: 'PLAYER_DONE'; playerId: PlayerId }  // Replaces PLAYER_PASSED
  | { type: 'CONQUER_TRIGGERED'; unitId: string; terrainId: TerrainId }
  | { type: 'PRIORITY_CHANGED'; newPriority: PlayerId }

  // Activate/Cooldown events (new)
  | { type: 'ABILITY_ACTIVATED'; unitId: string; abilityName: string }
  | { type: 'COOLDOWN_REDUCED'; unitId: string; newCooldown: number }

  // Match events
  | { type: 'MATCH_ENDED'; winner: PlayerId | null }

  // Controller events (for automated players)
  | { type: 'ACTION_REQUIRED'; playerId: PlayerId }
  | { type: 'TARGET_REQUIRED'; playerId: PlayerId; context: string; validTargets: string[] }  // Deprecated: use INPUT_REQUIRED
  | { type: 'INPUT_REQUIRED'; playerId: PlayerId; inputRequest: InputRequest }

  // State snapshot (sent after every action)
  | { type: 'STATE_SNAPSHOT'; state: GameState };

// Targeting information for cards that need targets
export type TargetInfo =
  | { type: 'none' }
  | { type: 'unit'; validUnitIds: string[] }
  | { type: 'terrain'; validTerrainIds: TerrainId[] }  // Replaces 'slot'
  | { type: 'enemy_unit'; validUnitIds: string[] }
  | { type: 'ally_unit'; validUnitIds: string[] }
  | { type: 'close_unit'; validUnitIds: string[] };
  // Note: 'far_unit' removed - no far targeting in V2

// Result of effect execution
export interface EffectResult {
  newState: GameState;
  events: GameEvent[];
}
