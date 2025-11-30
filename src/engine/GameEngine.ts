import type {
  GameState,
  GameAction,
  GameEvent,
  Card,
  UnitCard,
  PlayerId,
  SlotId,
  SlotEffect,
} from './types';
import { EventEmitter } from './EventEmitter';
import { EffectQueue } from './EffectQueue';
import { StateChecker } from './StateChecker';
import { createInitialGameState, getAdjacentSlots, getOpponent } from './GameState';
import type { Effect } from './effects/Effect';

/**
 * Core game engine.
 * Processes actions, resolves effects, and emits events.
 */
export class GameEngine {
  public state: GameState;
  public effectQueue: EffectQueue;
  private eventEmitter: EventEmitter;
  private stateChecker: StateChecker;

  constructor(deck1: Card[], deck2: Card[]) {
    this.state = createInitialGameState(deck1, deck2);
    this.effectQueue = new EffectQueue();
    this.eventEmitter = new EventEmitter();
    this.stateChecker = new StateChecker(this);
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
   */
  processAction(action: GameAction): GameState {
    // Validate action
    if (!this.isLegalAction(action)) {
      throw new Error(`Illegal action: ${JSON.stringify(action)}`);
    }

    // Convert action to effect
    const primaryEffect = this.actionToEffect(action);
    if (primaryEffect) {
      this.enqueueEffect(primaryEffect);
    }

    // Process effect queue until empty
    this.processEffectQueue();

    // Emit final state snapshot
    this.emitEvent({
      type: 'STATE_SNAPSHOT',
      state: this.state,
    });

    return this.state;
  }

  /**
   * Process the effect queue until empty
   */
  private processEffectQueue(): void {
    let iterations = 0;
    const MAX_ITERATIONS = 1000; // Prevent infinite loops

    while (!this.effectQueue.isEmpty()) {
      if (iterations++ > MAX_ITERATIONS) {
        throw new Error('Effect queue exceeded maximum iterations - possible infinite loop');
      }

      const effect = this.effectQueue.dequeue();
      if (!effect) break;

      // Execute effect
      const result = effect.execute(this.state);

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
    const { PlayCardEffect } = require('./effects/PlayCardEffect');
    const { PassEffect } = require('./effects/PassEffect');

    switch (action.type) {
      case 'PLAY_CARD':
        return new PlayCardEffect(action.playerId, action.cardId, action.slotId, action.targetUnitId, action.targetSlotId);

      case 'PASS':
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

    // Check if player has already passed
    if (this.state.hasPassed[action.playerId]) {
      return false;
    }

    switch (action.type) {
      case 'PLAY_CARD': {
        // Find card in hand
        const player = this.state.players[action.playerId];
        const card = player.hand.find((c) => c.id === action.cardId);
        if (!card) return false;

        // If it's a unit, must have a slotId
        if ('power' in card && action.slotId === undefined) {
          return false;
        }

        return true;
      }

      case 'PASS':
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
        player.discard.find((c) => c.id === cardId);
      if (card) return card;
    }

    // Check units on board
    for (const slot of this.state.slots) {
      for (const unit of slot.units) {
        if (unit && unit.id === cardId) return unit;
      }
    }

    return undefined;
  }

  /**
   * Get a unit by its instance ID
   */
  getUnitById(unitId: string): UnitCard | undefined {
    for (const slot of this.state.slots) {
      for (const unit of slot.units) {
        if (unit && unit.id === unitId) return unit as UnitCard;
      }
    }
    return undefined;
  }

  /**
   * Get close units to a given slot (adjacent slots)
   */
  getCloseUnits(slotId: SlotId | null, owner: PlayerId, filter: 'ally' | 'enemy' | 'any'): UnitCard[] {
    if (slotId === null) return [];

    const adjacentSlotIds = getAdjacentSlots(slotId);
    const units: UnitCard[] = [];

    for (const adjSlotId of adjacentSlotIds) {
      const slot = this.state.slots[adjSlotId as SlotId];
      for (let i = 0; i < 2; i++) {
        const unit = slot.units[i] as UnitCard | null;
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
   * Add an ongoing effect to a slot
   */
  addSlotEffect(slotId: SlotId, effect: SlotEffect): void {
    const slot = this.state.slots[slotId];
    slot.ongoingEffects.push(effect);

    this.emitEvent({
      type: 'SLOT_EFFECT_ADDED',
      slotId,
      effectId: effect.id,
      description: effect.description,
      owner: effect.owner,
    });
  }

  /**
   * Remove an ongoing effect from a slot
   */
  removeSlotEffect(slotId: SlotId, effectId: string): void {
    const slot = this.state.slots[slotId];
    slot.ongoingEffects = slot.ongoingEffects.filter((e) => e.id !== effectId);

    this.emitEvent({
      type: 'SLOT_EFFECT_REMOVED',
      slotId,
      effectId,
    });
  }

  /**
   * Get all units owned by a player
   */
  getPlayerUnits(playerId: PlayerId): UnitCard[] {
    const units: UnitCard[] = [];
    for (const slot of this.state.slots) {
      const unit = slot.units[playerId] as UnitCard | null;
      if (unit) units.push(unit);
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
