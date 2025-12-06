import { create } from 'zustand';
import type { GameState, PlayerId, GameEvent, InputRequest } from '../../engine/types';
import { GameEngine } from '../../engine/GameEngine';
import { createStarterDeck } from '../../utils/deckBuilder';
import { HumanController } from '../../engine/controllers/HumanController';
import { AIController } from '../../engine/controllers/AIController';

/**
 * Game Store - Event-Driven UI State Management
 *
 * ARCHITECTURE PRINCIPLE:
 * - UI never directly accesses engine.state
 * - UI = f(events)
 * - Controllers handle player input and submit actions to engine
 * - Engine emits events
 * - Store listens to events and updates UI state
 */

interface GameStore {
  // UI State (built from events only)
  gameState: GameState | null;
  eventLog: GameEvent[];

  // Input Request State (for targeting, modal choices, etc.)
  pendingInputRequest: InputRequest | null;
  pendingInputPlayerId: PlayerId | null;

  // Controllers (handle player actions)
  localController: HumanController | AIController | null;
  opponentController: HumanController | AIController | null;
  localPlayerId: PlayerId;

  // Engine reference (for controllers to submit actions)
  engine: GameEngine | null;

  // Initialization
  initGame: (localPlayerId: PlayerId) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  eventLog: [],
  pendingInputRequest: null,
  pendingInputPlayerId: null,
  localController: null,
  opponentController: null,
  localPlayerId: 0,
  engine: null,

  initGame: (localPlayerId: PlayerId) => {
    // Create controllers - local player is human, opponent is AI
    const controller0 = localPlayerId === 0 ? new HumanController(0) : new AIController(0, null as any);
    const controller1 = localPlayerId === 1 ? new HumanController(1) : new AIController(1, null as any);

    // Create engine
    const engine = new GameEngine(controller0, controller1);

    // Now set the engine reference in AI controllers
    if (controller0 instanceof AIController) {
      (controller0 as any).engine = engine;
    }
    if (controller1 instanceof AIController) {
      (controller1 as any).engine = engine;
    }

    // Create starter decks
    const player0Deck = createStarterDeck(0, engine);
    const player1Deck = createStarterDeck(1, engine);

    // Initialize game
    engine.initializeGame(player0Deck, player1Deck);

    // Subscribe to ALL engine events (this is how UI stays in sync)
    engine.onEvent((event: GameEvent) => {
      const currentState = get();

      // Add event to log
      const newEventLog = [...currentState.eventLog, event];

      // Handle INPUT_REQUIRED events
      if (event.type === 'INPUT_REQUIRED') {
        console.log('INPUT_REQUIRED received:', event.inputRequest);
        set({
          eventLog: newEventLog,
          pendingInputRequest: event.inputRequest,
          pendingInputPlayerId: event.playerId,
        });
        return;
      }

      // Update game state snapshot when engine emits it
      if (event.type === 'STATE_SNAPSHOT') {
        console.log('STATE_SNAPSHOT received, current player:', event.state.currentPlayer);
        set({
          eventLog: newEventLog,
          gameState: event.state,
          // Clear input request when state snapshot arrives (input was provided)
          pendingInputRequest: null,
          pendingInputPlayerId: null,
        });
      } else {
        // For other events, just log them with full details
        console.log('Event:', event.type, JSON.stringify(event, null, 2));
        set({ eventLog: newEventLog });
      }
    });

    // Set initial state (hands are empty at this point - proper architecture)
    set({
      engine,
      localController: localPlayerId === 0 ? controller0 : controller1,
      opponentController: localPlayerId === 0 ? controller1 : controller0,
      localPlayerId,
      gameState: engine.state,
      eventLog: [],
    });
  },
}));
