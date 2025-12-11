import type {
  GameState,
  GameAction,
  GameEvent,
  PlayerId,
  TerrainId,
  PlayerSlotId,
  UnitCard as IUnitCard,
  PlayerInfo
} from './types';
import type { Card } from './cards/Card'; // Change to type import for interface usage
import { UnitCard } from './cards/Card'; // Import class for value usage
import { EventEmitter } from './EventEmitter';
import { EffectStack } from './EffectStack';
import { StateChecker } from './StateChecker';
import { createInitialGameState, getAdjacentTerrains, getOpponent, getUnitInFront } from './GameState';
import type { Effect } from './effects/Effect';
import type { PlayerController } from './controllers/PlayerController';
import { RuleManager } from './rules/RuleManager';
import { RuleType } from './rules/RuleTypes';
import { Player } from './Player';
import { TurnEndEffect } from './effects/TurnEndEffect';
import { ResolveSkirmishEffect } from './effects';
import { GameLogger } from './GameLogger';
import { SeededRNG } from './SeededRNG';
import { StateHasher } from './StateHasher';

/**
 * Core game engine.
 * Processes actions, resolves effects, and emits events.
 */
export class GameEngine {
  public state: GameState;
  public effectStack: EffectStack;
  public ruleManager: RuleManager;
  public logger: GameLogger;
  public rng: SeededRNG;
  private eventEmitter: EventEmitter<GameEvent>;
  private actionEmitter: EventEmitter<GameAction>;
  private stateChecker: StateChecker;
  private controllers: [PlayerController, PlayerController];
  public pendingInputResolve: ((input: any) => void) | null = null;

  constructor(
    controller0: PlayerController,
    controller1: PlayerController,
    options?: {
      seed?: number;
    }
  ) {
    this.state = {} as GameState;
    this.effectStack = new EffectStack();
    this.ruleManager = new RuleManager();
    this.eventEmitter = new EventEmitter();
    this.actionEmitter = new EventEmitter();
    this.stateChecker = new StateChecker(this);
    this.controllers = [controller0, controller1];
    
    // Initialize seeded RNG (defaults to current time for local games)
    const seed = options?.seed ?? Date.now();
    this.rng = new SeededRNG(seed);

    // Initialize logger with player info
    const player0Info: PlayerInfo = {
      id: 0,
      name: 'Player 1',
      type: controller0.type === 'ai' ? 'ai' : 'human'
    };
    const player1Info: PlayerInfo = {
      id: 1,
      name: 'Player 2',
      type: controller1.type === 'ai' ? 'ai' : 'human'
    };
    this.logger = new GameLogger(player0Info, player1Info);

    // Controllers subscribe to all events
    this.onEvent((event) => {
      this.controllers.forEach((controller) => controller.onEvent(event));
    });

    // Log game result when match ends
    this.onEvent((event) => {
      if (event.type === 'MATCH_ENDED') {
        this.logger.setResult(event.winner, this.state);
      }
    });
  }

  async initializeGame(deck1: Card[], deck2: Card[]) {
    // Pass 'this' (the engine) and RNG to createInitialGameState
    this.state = createInitialGameState(deck1, deck2, this, this.rng);

    // Start the first skirmish (draw initial hands)
    const { StartSkirmishEffect } = await import('./effects/StartSkirmishEffect');
    this.addInterrupt(new StartSkirmishEffect());
    await this.processEffectStack();

    // Emit ACTION_REQUIRED for the first player
    await this.checkForRequiredActions();
  }

  /**
   * Subscribe to game events
   */
  onEvent(callback: (event: GameEvent) => void): () => void {
    return this.eventEmitter.subscribe(callback);
  }

  /**
   * Subscribe to game actions
   */
  onAction(callback: (event: GameAction) => void): () => void {
    return this.actionEmitter.subscribe(callback);
  }

  /**
   * Emit an event
   */
  async emitEvent(event: GameEvent): Promise<void> {
    await this.eventEmitter.emit(event);
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

    await this.actionEmitter.emit(action);

    switch (action.type) {
      case 'PLAY_CARD': {
        // Player plays the card
        const player = this.getPlayer(action.playerId);
        this.addInterrupt(new TurnEndEffect());
        await player.playCard(action.cardId, action.targetSlot);
        break;
      }

      case 'ACTIVATE': {
        // Unit activates ability
        const unit = this.getUnitById(action.unitId);
        if (unit) {
          await unit.activate();
        }
        break;
      }

      case 'DONE': {
        // Player passes
        const player = this.getPlayer(action.playerId);
        await player.pass();
        await this.emitEvent({
          type: 'PLAYER_PASSED',
          playerId: player.id,
        });
        this.addInterrupt(new TurnEndEffect());
        break;
      }
    }

    // Process effect stack (await it) - triggers like TurnEnd or OnDeploy/OnDeath run here
    await this.processEffectStack();

    // Only emit STATE_SNAPSHOT if not waiting for input
    if (!this.pendingInputResolve) {
      await this.emitEvent({
        type: 'STATE_SNAPSHOT',
        state: this.state,
      });

      // Check if anyone needs to act
      await this.checkForRequiredActions();
    }

    return this.state;
  }

  /**
   * Public alias for processAction (used by controllers)
   */
  async submitAction(action: GameAction, reasoning?: string): Promise<GameState> {
    // Log the action before processing
    const controller = this.controllers[action.playerId];
    const playerType = controller.type === 'ai' ? 'ai' : 'human';
    this.logger.logAction(action, playerType, this.state, reasoning);

    return await this.processAction(action);
  }

  /**
   * Check if current player needs to make a decision and emit ACTION_REQUIRED
   */
  private async checkForRequiredActions(): Promise<void> {
    const currentPlayer = this.state.currentPlayer;

    // Only emit if game is ongoing and player hasn't declared done
    if (
      this.state.matchWinner === undefined &&
      !this.state.isDone[currentPlayer]  // Changed from hasPassed
    ) {
      await this.emitEvent({
        type: 'ACTION_REQUIRED',
        playerId: currentPlayer,
      });
    }
  }

  /**
   * Process the effect stack until empty
   * Now async to support input requests during effect execution
   */
  private async processEffectStack(): Promise<void> {
    let iterations = 0;
    const MAX_ITERATIONS = 1000; // Prevent infinite loops

    while (!this.effectStack.isEmpty()) {
      if (iterations++ > MAX_ITERATIONS) {
        throw new Error('Effect stack exceeded maximum iterations - possible infinite loop');
      }

      const effect = this.effectStack.pop();
      if (!effect) break;

      // Execute effect (now async) - will naturally pause if effect awaits input
      const result = await effect.execute(this.state);
      this.stateChecker.checkStateConditions(this.state);

      // Update state
      this.state = result.newState;

      // Emit events
      // Wait for events to be processed (critical for async event listeners)
      for (const e of result.events) {
        await this.emitEvent(e);
        this.stateChecker.checkStateConditions(this.state);
      }
    }
  }

  /**
   * Submit player input (for targeting, modal choices, etc.)
   * Resolves the pending input Promise, allowing effect execution to continue
   */
  async submitInput(input: any): Promise<void> {
    if (!this.pendingInputResolve) {
      throw new Error('No input request in progress');
    }

    // Get the player who this input is for (from the pending request)
    const playerId = this.state.currentPlayer; // The player whose turn it is
    
    // Generate checksum for this input
    const checksum = StateHasher.hashStateSync(this.state);
    
    // Emit INPUT action for network sync
    const inputAction: GameAction = {
      type: 'INPUT',
      playerId,
      input,
      checksum
    };

    await this.actionEmitter.emit(inputAction);

    // Resolve the Promise that requestInput() is awaiting
    this.pendingInputResolve(input);
    this.pendingInputResolve = null;
  }

  /**
   * Add a single high-priority effect (Interrupt/Trigger)
   * It will execute immediately after the current effect finishes.
   */
  addInterrupt(effect: Effect): void {
    effect.setEngine(this);
    this.effectStack.push(effect);
  }

  /**
   * Add a chain of effects to execute in order (A -> B -> C)
   * Result: A is on top (executes first), then B, then C.
   */
  addSequence(effects: Effect[]): void {
    effects.forEach(e => e.setEngine(this));
    this.effectStack.pushSequence(effects);
  }

  // Deprecated alias for backwards compatibility during migration (optional)
  enqueueEffect(effect: Effect): void {
      this.addInterrupt(effect);
  }

  // Removed actionToEffect as logic is now in processAction

  /**
   * Check if an action is legal in the current game state
   */
  private isLegalAction(action: GameAction): boolean {
    // Check if game is over
    if (this.state.matchWinner !== undefined) {
      console.log(`action [${JSON.stringify(action)}] is not legal because game ended`);
      return false;
    }

    // Check if it's the player's turn
    if (action.playerId !== this.state.currentPlayer) {
      console.log(`action [${JSON.stringify(action)}] is not legal not current player [${this.state.currentPlayer}]`);
      return false;
    }

    // Check if player has already declared done
    if (this.state.isDone[action.playerId]) {  // Changed from hasPassed
      console.log(`action [${JSON.stringify(action)}] is not legal current player done [${this.state.currentPlayer}]`);
      return false;
    }

    switch (action.type) {
      case 'PLAY_CARD': {
        // Find card in hand
        const player = this.state.players[action.playerId];
        const card = player.hand.find((c) => c.id === action.cardId);
        if (!card) {
          console.log(`action [${JSON.stringify(action)}] card not found [${action.cardId}]`);
          return false;
        }

        // If action has no target, allow it ONLY if card doesn't need one
        if (!action.targetSlot) {
          if (card.needsTarget()) {
            console.log(`action [${JSON.stringify(action)}] needed target and not found`);
            return false;
          }
          return true;
        }

        // Validate target
        if (card.getType() === 'unit') {
          // Unit deployment check
          if (!this.isDeploymentAllowed(card, action.targetSlot.terrainId)) {
            console.log(`action [${JSON.stringify(action)}] deployment not allowed [${action.targetSlot.terrainId}]`);
            return false;
          }
        } else {
          // Action card targeting check
          if (!this.isTargetingAllowed(card, action.targetSlot)) {
            console.log(`action [${JSON.stringify(action)}] target not allowed [${action.targetSlot.terrainId}]`);
            return false;
          }
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
        console.log(`action [${JSON.stringify(action)}] unknown type`);
        return false;
    }
  }

  // ========== Rule System Validation ==========

  /**
   * Check if a card can be deployed to a specific terrain
   */
  isDeploymentAllowed(card: Card, terrainId: TerrainId): boolean {
    const terrain = this.state.terrains[terrainId];
    const slot = terrain.slots[card.owner];
    const existingUnit = slot.unit;
    
    // Basic rule: can deploy if slot is empty OR unit can be consumed
    let allowed = true;
    if (existingUnit) {
        // If unit is in place, it MUST be consumable. 
        allowed = true;
    }

    // Check rules
    return this.ruleManager.evaluate(
      RuleType.CAN_DEPLOY,
      {
        deployingCard: card,
        targetSlot: { terrainId, playerId: card.owner },
        targetUnitId: existingUnit?.id,
      },
      allowed
    );
  }

  /**
   * Check if a card can target a specific unit or terrain
   */
  isTargetingAllowed(sourceCard: Card, targetSlot: { terrainId: TerrainId; playerId: PlayerId }): boolean {
    let allowed = true;

    // Check rules
    return this.ruleManager.evaluate(
      RuleType.CAN_TARGET,
      {
        sourceCard,
        targetSlot,
      },
      allowed
    );
  }

  /**
   * Get all legal actions for a player in the current state
   * This properly validates actions using all rule checks (e.g., Sentinel blocking)
   */
  getLegalActions(playerId: PlayerId): GameAction[] {
    const actions: GameAction[] = [];
    
    // Check if player can act at all
    if (this.state.matchWinner !== undefined || 
        this.state.currentPlayer !== playerId ||
        this.state.isDone[playerId]) {
      return actions;
    }
    
    // Can always pass
    actions.push({ type: 'DONE', playerId });
    
    const player = this.state.players[playerId];
    
    // Check each card in hand
    player.hand.forEach(card => {
      if (card.getType() === 'unit') {
        // Unit cards - check each terrain for valid deployment
        this.state.terrains.forEach((terrain, terrainId) => {
          // Must be empty slot
          if (!terrain.slots[playerId].unit) {
            // Check deployment rules (e.g., Sentinel blocking)
            if (this.isDeploymentAllowed(card, terrainId as TerrainId)) {
              actions.push({
                type: 'PLAY_CARD',
                playerId,
                cardId: card.id,
                targetSlot: { terrainId: terrainId as TerrainId, playerId }
              });
            }
          }
        });
      } else {
        // Action cards
        if (!card.needsTarget()) {
          // No target needed - always valid
          actions.push({
            type: 'PLAY_CARD',
            playerId,
            cardId: card.id
          });
        } else {
          // Action card with targeting
          const targets = card.getValidTargets(this.state);
          if (targets.type === 'slots' && targets.validSlots) {
            targets.validSlots.forEach((slot: { terrainId: TerrainId; playerId: PlayerId }) => {
              // Check targeting rules
              if (this.isTargetingAllowed(card, slot)) {
                actions.push({
                  type: 'PLAY_CARD',
                  playerId,
                  cardId: card.id,
                  targetSlot: slot
                });
              }
            });
          }
        }
      }
    });
    
    // Check activate actions for units on field
    this.state.terrains.forEach(terrain => {
      const unit = terrain.slots[playerId].unit;
      if (unit && unit.owner === playerId) {
        const unitCard = unit as unknown as UnitCard;
        if (unitCard.canActivate && unitCard.canActivate()) {
          actions.push({
            type: 'ACTIVATE',
            playerId,
            unitId: unit.id
          });
        }
      }
    });
    
    return actions;
  }

  /**
   * Calculate the winner of a terrain based on current state and rules.
   * This is used by ResolveSkirmishEffect AND by the UI to preview winners.
   */
  calculateTerrainWinner(terrainId: TerrainId): PlayerId | null {
    const terrain = this.state.terrains[terrainId];
    if (!terrain) return null;

    const unit0 = terrain.slots[0].unit;
    const unit1 = terrain.slots[1].unit;

    // Calculate power (unit.power getter already includes slot modifiers)
    const power0 = unit0 ? (unit0 as unknown as UnitCard).power : 0;
    const power1 = unit1 ? (unit1 as unknown as UnitCard).power : 0;

    // Determine default winner logic (Standard Skirmish Rule)
    let defaultWinner: PlayerId | null = null;

    if (unit0 && unit1) {
      // Both players have units - compare power
      if (power0 > power1) {
        defaultWinner = 0;
      } else if (power1 > power0) {
        defaultWinner = 1;
      } else {
        // Tie
        defaultWinner = null;
      }
    } else if (unit0) {
      // Only player 0 has unit
      defaultWinner = 0;
    } else if (unit1) {
      // Only player 1 has unit
      defaultWinner = 1;
    } else {
      // Empty terrain
      defaultWinner = null;
    }

    // Allow rules to override the winner (e.g. Rogue)
    return this.ruleManager.evaluate<PlayerId | null>(
      RuleType.DETERMINE_TERRAIN_WINNER,
      {
        terrainId,
        power0,
        power1
      },
      defaultWinner
    );
  }

  // ========== Helper Methods for Cards ==========

  /**
   * Get a player instance
   */
  getPlayer(playerId: PlayerId): Player {
    // Cast to Player class (we know it is one because of createInitialGameState)
    return this.state.players[playerId] as Player;
  }

  /**
   * Get a card by its instance ID
   */
  getCardById(cardId: string): Card | undefined {
    for (const player of Object.values(this.state.players)) {
      const card =
        player.hand.find((c) => c.id === cardId) ||
        player.deck.find((c) => c.id === cardId) ||
        player.graveyard.find((c) => c.id === cardId);  // Changed from discard
      if (card) return card;
    }

    // Check units on terrains
    for (const terrain of this.state.terrains) {
      if (terrain.slots[0].unit?.id === cardId) return terrain.slots[0].unit as unknown as Card;
      if (terrain.slots[1].unit?.id === cardId) return terrain.slots[1].unit as unknown as Card;
    }

    return undefined;
  }

  /**
   * Get a unit by its instance ID
   */
  getUnitById(unitId: string): UnitCard | undefined {
    // Check board
    for (const terrain of this.state.terrains) {
      if (terrain.slots[0].unit?.id === unitId) return terrain.slots[0].unit as unknown as UnitCard;
      if (terrain.slots[1].unit?.id === unitId) return terrain.slots[1].unit as unknown as UnitCard;
    }
    
    // Check hands (for units being deployed/consumed interactions)
    for (const playerId of [0, 1] as PlayerId[]) {
      const card = this.state.players[playerId].hand.find(c => c.id === unitId);
      if (card && card.getType() === 'unit') return card as unknown as UnitCard;
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

        const typedUnit = unit as unknown as UnitCard;

        if (filter === 'ally' && typedUnit.owner === owner) {
          units.push(typedUnit);
        } else if (filter === 'enemy' && typedUnit.owner !== owner) {
          units.push(typedUnit);
        } else if (filter === 'any') {
          units.push(typedUnit);
        }
      }
    }

    return units;
  }

  /**
   * Get unit in front (opposite player's unit on same terrain)
   */
  getUnitInFront(terrainId: TerrainId, playerId: PlayerId): UnitCard | null {
    return getUnitInFront(this.state, terrainId, playerId) as unknown as UnitCard;
  }

  /**
   * Get a unit by its slot coordinates
   */
  getUnitAt(slot: { terrainId: TerrainId; playerId: PlayerId }): UnitCard | null {
    const terrain = this.state.terrains[slot.terrainId];
    if (!terrain) return null;
    return terrain.slots[slot.playerId].unit as unknown as UnitCard;
  }

  /**
   * Add slot modifier (replaces addSlotEffect - simpler system)
   */
  async addSlotModifier(terrainId: TerrainId, playerId: PlayerId, amount: number): Promise<void> {
    if (!this.state.terrains[terrainId]) return;

    this.state.terrains[terrainId].slots[playerId].modifier += amount;

    await this.emitEvent({
      type: 'SLOT_MODIFIER_CHANGED',
      terrainId,
      playerId,
      newModifier: this.state.terrains[terrainId].slots[playerId].modifier,
    });

    // We don't need to manually update unit power anymore as it's calculated dynamically
    // But we should emit a power change event for the UI if a unit is present
    const unit = this.state.terrains[terrainId].slots[playerId].unit;
    if (unit) {
      await this.emitEvent({
        type: 'UNIT_POWER_CHANGED',
        unitId: unit.id,
        terrainId,
        oldPower: (unit as unknown as UnitCard).power - amount, // Approximation
        newPower: (unit as unknown as UnitCard).power,
        amount,
      });
    }
  }

  /**
   * Get the modifier for a specific slot
   */
  getSlotModifier(terrainId: TerrainId, playerId: PlayerId): number {
    if (!this.state.terrains[terrainId]) return 0;
    return this.state.terrains[terrainId].slots[playerId].modifier;
  }

  /**
   * Get all units owned by a player
   */
  getPlayerUnits(playerId: PlayerId): UnitCard[] {
    const units: UnitCard[] = [];
    for (const terrain of this.state.terrains) {
      const unit = terrain.slots[playerId as PlayerSlotId].unit;
      if (unit) units.push(unit as unknown as UnitCard);
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
