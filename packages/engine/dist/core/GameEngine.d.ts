import type { GameState, GameAction, GameEvent, PlayerId, TerrainId, PlayerState } from './types';
import type { Card } from '../mechanics/cards/Card';
import type { UnitCard } from '../mechanics/cards/Card';
import { EffectStack } from '../systems/EffectStack';
import type { Effect } from '../mechanics/effects/Effect';
import type { PlayerController } from '../controllers/PlayerController';
import { RuleManager } from '../systems/rules/RuleManager';
import { Player } from '../entities/Player';
import { GameLogger } from './logger/GameLogger';
import { SeededRNG } from './SeededRNG';
import { Game } from '../entities/Game';
import { Terrain } from '../entities/Terrain';
/**
 * Core game engine.
 * Processes actions, resolves effects, and emits events.
 */
export declare class GameEngine {
    get state(): GameState;
    game: Game;
    players: [Player, Player];
    terrains: [Terrain, Terrain, Terrain, Terrain, Terrain];
    leaders: [any, any];
    effectStack: EffectStack;
    ruleManager: RuleManager;
    logger: GameLogger;
    rng: SeededRNG;
    private eventEmitter;
    private actionEmitter;
    private stateChecker;
    private controllers;
    pendingInputResolve: ((input: any) => void) | null;
    constructor(controller0: PlayerController, controller1: PlayerController, options?: {
        seed?: number;
    });
    initializeGame(deck1: Card[], deck2: Card[], leader1Id?: string, leader2Id?: string, startingPlayer?: PlayerId): Promise<void>;
    /**
     * Subscribe to game events
     */
    onEvent(callback: (event: GameEvent) => void): () => void;
    /**
     * Subscribe to game actions
     */
    onAction(callback: (event: GameAction) => void): () => void;
    /**
     * Emit an event
     */
    emitEvent(event: GameEvent): Promise<void>;
    /**
     * Process a game action
     * Now async to support input requests during effect execution.
     * All actions are wrapped in Effects for consistent ordering and status effect management.
     */
    processAction(action: GameAction): Promise<GameState>;
    /**
     * Public alias for processAction (used by controllers)
     */
    submitAction(action: GameAction, reasoning?: string): Promise<GameState>;
    /**
     * Check if current player needs to make a decision and emit ACTION_REQUIRED
     * Auto-passes if the player has acted this turn and has no more actions available
     */
    private checkForRequiredActions;
    /**
     * Process the effect stack until empty
     * Now async to support input requests during effect execution
     */
    private processEffectStack;
    /**
     * Submit player input (for targeting, modal choices, etc.)
     * Resolves the pending input Promise, allowing effect execution to continue
     */
    submitInput(input: any): Promise<void>;
    /**
     * Add a single high-priority effect (Interrupt/Trigger)
     * It will execute immediately after the current effect finishes.
     */
    addInterrupt(effect: Effect): void;
    /**
     * Add a chain of effects to execute in order (A -> B -> C)
     * Result: A is on top (executes first), then B, then C.
     */
    addSequence(effects: Effect[]): void;
    enqueueEffect(effect: Effect): void;
    /**
     * Check if an action is legal in the current game state
     */
    private isLegalAction;
    /**
     * Check if a card can be deployed to a specific terrain
     */
    isDeploymentAllowed(card: Card, terrainId: TerrainId): boolean;
    /**
     * Check if a card can target a specific unit or terrain
     */
    isTargetingAllowed(sourceCard: Card, targetSlot: {
        terrainId: TerrainId;
        playerId: PlayerId;
    }): boolean;
    /**
     * Get all legal actions for a player in the current state
     * This properly validates actions using all rule checks (e.g., Sentinel blocking)
     */
    getLegalActions(playerId: PlayerId): GameAction[];
    /**
     * Calculate the winner of a terrain based on current state and rules.
     * This is used by ResolveSkirmishEffect AND by the UI to preview winners.
     */
    calculateTerrainWinner(terrainId: TerrainId): PlayerId | null;
    /**
     * Get a player instance
     */
    getPlayer(playerId: PlayerId): Player;
    /**
     * Get a card by its instance ID
     */
    getCardById(cardId: string): Card | undefined;
    /**
     * Get a unit by its instance ID
     */
    getUnitById(unitId: string): UnitCard | undefined;
    /**
     * Get close units to a given terrain
     * Close = adjacent terrains (left/right) AND unit in front (same terrain, opposite slot)
     */
    getCloseUnits(terrainId: TerrainId | null, owner: PlayerId, filter: 'ally' | 'enemy' | 'any'): UnitCard[];
    /**
     * Get unit in front (opposite player's unit on same terrain)
     */
    getUnitInFront(terrainId: TerrainId, playerId: PlayerId): UnitCard | null;
    private kOpponent;
    /**
     * Get a unit by its slot coordinates
     */
    getUnitAt(slot: {
        terrainId: TerrainId;
        playerId: PlayerId;
    }): UnitCard | null;
    /**
     * Add slot modifier (replaces addSlotEffect - simpler system)
     */
    addSlotModifier(terrainId: TerrainId, playerId: PlayerId, amount: number): Promise<void>;
    /**
     * Get the modifier for a specific slot
     */
    getSlotModifier(terrainId: TerrainId, playerId: PlayerId): number;
    /**
     * Get all units owned by a player
     */
    getPlayerUnits(playerId: PlayerId): UnitCard[];
    /**
     * Get a player's state (snapshot)
     */
    getPlayerState(playerId: PlayerId): PlayerState;
    /**
     * Get opponent player ID
     */
    getOpponent(playerId: PlayerId): PlayerId;
}
