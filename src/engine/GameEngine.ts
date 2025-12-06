import type {
  GameState,
  GameAction,
  GameEvent,
  Card,
  UnitCard,
  PlayerId,
  TerrainId,
  PlayerSlotId,
} from './types';
import { EventEmitter } from './EventEmitter';
import { EffectQueue } from './EffectQueue';
import { StateChecker } from './StateChecker';
import { createInitialGameState, getAdjacentTerrains, getOpponent, getUnitInFront } from './GameState';
import type { Effect } from './effects/Effect';
import { PlayCardEffect } from './effects';
import { PassEffect } from './effects/PassEffect';
import type { PlayerController } from './controllers/PlayerController';

/**
 * Core game engine.
 * Processes actions, resolves effects, and emits events.
 */
export class GameEngine {
  public state: GameState;
  public effectQueue: EffectQueue;
  private eventEmitter: EventEmitter;
  private stateChecker: StateChecker;
  private controllers: [PlayerController, PlayerController];
  public pendingInputResolve: ((input: any) => void) | null = null;

  constructor(controller0: PlayerController, controller1: PlayerController) {
    this.state = {} as GameState;
    this.effectQueue = new EffectQueue();
    this.eventEmitter = new EventEmitter();
    this.stateChecker = new StateChecker(this);
    this.controllers = [controller0, controller1];

    // Controllers subscribe to all events
    this.onEvent((event) => {
      this.controllers.forEach((controller) => controller.onEvent(event));
    });
  }

  async initializeGame(deck1: Card[], deck2: Card[]) {
    this.state = createInitialGameState(deck1, deck2);

    // Start the first skirmish (draw initial hands)
    const { StartSkirmishEffect } = await import('./effects/StartSkirmishEffect');
    this.enqueueEffect(new StartSkirmishEffect());
    await this.processEffectQueue();

    // Emit ACTION_REQUIRED for the first player
    this.checkForRequiredActions();
  }

  /**
   * Subscribe to game events
   */
  onEvent(callback: (event: GameEvent) => void): () => void {
    return this.eventEmitter.subscribe(callback);
  }

  /**
   * Emit an event
   */
  emitEvent(event: GameEvent): void {
    this.eventEmitter.emit(event);
  }

  /**
   * Process a game action
   * Now async to support input requests during effect execution
   */
  async processAction(action: GameAction): Promise<GameState> {
    // Validate action
    if (!this.isLegalAction(action)) {
      throw new Error(`Illegal action: ${JSON.stringify(action)}`);
    }

    // Convert action to effect
    const primaryEffect = this.actionToEffect(action);
    if (primaryEffect) {
      this.enqueueEffect(primaryEffect);
    }

    // Process effect queue (await it)
    await this.processEffectQueue();

    // Only emit STATE_SNAPSHOT if not waiting for input
    if (!this.pendingInputResolve) {
      this.emitEvent({
        type: 'STATE_SNAPSHOT',
        state: this.state,
      });

      // Check if anyone needs to act
      this.checkForRequiredActions();
    }

    return this.state;
  }

  /**
   * Public alias for processAction (used by controllers)
   */
  async submitAction(action: GameAction): Promise<GameState> {
    return await this.processAction(action);
  }

  /**
   * Check if current player needs to make a decision and emit ACTION_REQUIRED
   */
  private checkForRequiredActions(): void {
    const currentPlayer = this.state.currentPlayer;

    // Only emit if game is ongoing and player hasn't declared done
    if (
      this.state.matchWinner === undefined &&
      !this.state.isDone[currentPlayer]  // Changed from hasPassed
    ) {
      this.emitEvent({
        type: 'ACTION_REQUIRED',
        playerId: currentPlayer,
      });
    }
  }

  /**
   * Process the effect queue until empty
   * Now async to support input requests during effect execution
   */
  private async processEffectQueue(): Promise<void> {
    let iterations = 0;
    const MAX_ITERATIONS = 1000; // Prevent infinite loops

    while (!this.effectQueue.isEmpty()) {
      if (iterations++ > MAX_ITERATIONS) {
        throw new Error('Effect queue exceeded maximum iterations - possible infinite loop');
      }

      const effect = this.effectQueue.dequeue();
      if (!effect) break;

      // Execute effect (now async) - will naturally pause if effect awaits input
      const result = await effect.execute(this.state);

      // Update state
      this.state = result.newState;

      // Emit events
      result.events.forEach((e) => this.emitEvent(e));

      // Check for state-based effects (deaths, etc.)
      const stateEffects = this.stateChecker.checkStateConditions(this.state);
      stateEffects.forEach((e) => this.enqueueEffect(e));
    }
  }

  /**
   * Submit player input (for targeting, modal choices, etc.)
   * Resolves the pending input Promise, allowing effect execution to continue
   */
  submitInput(input: any): void {
    if (!this.pendingInputResolve) {
      throw new Error('No input request in progress');
    }

    // Resolve the Promise that requestInput() is awaiting
    this.pendingInputResolve(input);
    this.pendingInputResolve = null;

    // No need to call processEffectQueue() - it's already running, just paused at the await
  }

  /**
   * Enqueue an effect and set its engine reference
   */
  enqueueEffect(effect: Effect): void {
    effect.setEngine(this);
    this.effectQueue.enqueue(effect);
  }

  /**
   * Convert a game action to an effect
   */
  private actionToEffect(action: GameAction): Effect | null {
    // Import effects here to avoid circular dependencies
    switch (action.type) {
      case 'PLAY_CARD':
        return new PlayCardEffect(
          action.playerId,
          action.cardId,
          action.terrainId,  // Changed from slotId
          action.targetUnitId,
          action.targetTerrainId  // Changed from targetSlotId
        );

      case 'ACTIVATE':
        // TODO: Implement ActivateAbilityEffect
        // return new ActivateAbilityEffect(action.unitId);
        return null;

      case 'DONE':  // Changed from PASS
        return new PassEffect(action.playerId);

      default:
        return null;
    }
  }

  /**
   * Check if an action is legal in the current game state
   */
  private isLegalAction(action: GameAction): boolean {
    // Check if game is over
    if (this.state.matchWinner !== undefined) {
      return false;
    }

    // Check if it's the player's turn
    if (action.playerId !== this.state.currentPlayer) {
      return false;
    }

    // Check if player has already declared done
    if (this.state.isDone[action.playerId]) {  // Changed from hasPassed
      return false;
    }

    switch (action.type) {
      case 'PLAY_CARD': {
        // Find card in hand
        const player = this.state.players[action.playerId];
        const card = player.hand.find((c) => c.id === action.cardId);
        if (!card) return false;

        // If it's a unit, must have a terrainId
        if ('power' in card && action.terrainId === undefined) {
          return false;
        }

        return true;
      }

      case 'ACTIVATE': {
        // Find unit
        const unit = this.getUnitById(action.unitId);
        if (!unit) return false;

        // Check if unit belongs to current player
        if (unit.owner !== action.playerId) return false;

        // Check if unit can activate
        return unit.canActivate();
      }

      case 'DONE':  // Changed from PASS
        return true;

      default:
        return false;
    }
  }

  // ========== Helper Methods for Cards ==========

  /**
   * Get a card by its instance ID
   */
  getCardById(cardId: string): Card | undefined {
    for (const player of this.state.players) {
      const card =
        player.hand.find((c) => c.id === cardId) ||
        player.deck.find((c) => c.id === cardId) ||
        player.graveyard.find((c) => c.id === cardId);  // Changed from discard
      if (card) return card;
    }

    // Check units on terrains
    for (const terrain of this.state.terrains) {
      if (terrain.slots[0].unit?.id === cardId) return terrain.slots[0].unit;
      if (terrain.slots[1].unit?.id === cardId) return terrain.slots[1].unit;
    }

    return undefined;
  }

  /**
   * Get a unit by its instance ID
   */
  getUnitById(unitId: string): UnitCard | undefined {
    for (const terrain of this.state.terrains) {
      if (terrain.slots[0].unit?.id === unitId) return terrain.slots[0].unit as UnitCard;
      if (terrain.slots[1].unit?.id === unitId) return terrain.slots[1].unit as UnitCard;
    }
    return undefined;
  }

  /**
   * Get close units to a given terrain
   * Close = adjacent terrains (left/right) AND unit in front (same terrain, opposite slot)
   */
  getCloseUnits(terrainId: TerrainId | null, owner: PlayerId, filter: 'ally' | 'enemy' | 'any'): UnitCard[] {
    if (terrainId === null) return [];

    const units: UnitCard[] = [];

    // 1. Get unit in front (same terrain, opposite slot)
    const unitInFront = this.getUnitInFront(terrainId, owner);
    if (unitInFront) {
      if (filter === 'ally' && unitInFront.owner === owner) {
        units.push(unitInFront);
      } else if (filter === 'enemy' && unitInFront.owner !== owner) {
        units.push(unitInFront);
      } else if (filter === 'any') {
        units.push(unitInFront);
      }
    }

    // 2. Get units on adjacent terrains (left/right)
    const adjacentTerrainIds = getAdjacentTerrains(terrainId);
    for (const adjTerrainId of adjacentTerrainIds) {
      const terrain = this.state.terrains[adjTerrainId as TerrainId];
      const unit0 = terrain.slots[0].unit;
      const unit1 = terrain.slots[1].unit;

      for (const unit of [unit0, unit1]) {
        if (!unit) continue;

        if (filter === 'ally' && unit.owner === owner) {
          units.push(unit);
        } else if (filter === 'enemy' && unit.owner !== owner) {
          units.push(unit);
        } else if (filter === 'any') {
          units.push(unit);
        }
      }
    }

    return units;
  }

  /**
   * Get unit in front (opposite player's unit on same terrain)
   */
  getUnitInFront(terrainId: TerrainId, playerId: PlayerId): UnitCard | null {
    return getUnitInFront(this.state, terrainId, playerId);
  }

  /**
   * Add slot modifier (replaces addSlotEffect - simpler system)
   */
  addSlotModifier(terrainId: TerrainId, playerId: PlayerId, amount: number): void {
    this.state.terrains[terrainId].slots[playerId].modifier += amount;

    this.emitEvent({
      type: 'SLOT_MODIFIER_CHANGED',
      terrainId,
      playerId,
      newModifier: this.state.terrains[terrainId].slots[playerId].modifier,
    });
  }

  /**
   * Get all units owned by a player
   */
  getPlayerUnits(playerId: PlayerId): UnitCard[] {
    const units: UnitCard[] = [];
    for (const terrain of this.state.terrains) {
      const unit = terrain.slots[playerId as PlayerSlotId].unit;
      if (unit) units.push(unit as UnitCard);
    }
    return units;
  }

  /**
   * Get opponent player ID
   */
  getOpponent(playerId: PlayerId): PlayerId {
    return getOpponent(playerId);
  }
}
