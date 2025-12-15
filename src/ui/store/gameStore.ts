import { create } from 'zustand';
import type { GameState, PlayerId, GameEvent, InputRequest } from '../../engine/types';
import { GameEngine } from '../../engine/GameEngine';
import { createStarter1Deck, createStarter2Deck, createTestDeck } from '../../utils/deckBuilder';
import { createDeck } from '../../engine/cards';
import { HumanController } from '../../engine/controllers/HumanController';
import { AIController } from '../../engine/controllers/AIController';
import { ClaudeAI } from '../../engine/ai/ClaudeAI';
import { useDeckStore } from './deckStore';

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

  // AI State
  isAIThinking: boolean;
  aiThinkingPlayerId: PlayerId | null;

  // Game Mode
  gameMode: 'vs-ai' | 'human-vs-human' | 'god-mode' | 'network';

  // Controllers (handle player actions)
  localController: HumanController | AIController | null;
  opponentController: HumanController | AIController | null;
  localPlayerId: PlayerId;

  // Engine reference (for controllers to submit actions)
  engine: GameEngine | null;

  // Network state
  networkGameId: string | null;
  networkGameCode: string | null; // 6-digit code for easy sharing
  networkSync: any | null; // NetworkSync instance

  // Initialization
  initGame: (localPlayerId: PlayerId, mode?: 'vs-ai' | 'human-vs-human' | 'god-mode') => void;
  initNetworkGame: (localPlayerId: PlayerId, action: 'create' | string) => Promise<void>;
  
  // Game logging
  downloadGameLog: () => void;

  // AI thinking state
  setAIThinking: (playerId: PlayerId | null) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  eventLog: [],
  pendingInputRequest: null,
  pendingInputPlayerId: null,
  isAIThinking: false,
  aiThinkingPlayerId: null,
  gameMode: 'vs-ai',
  localController: null,
  opponentController: null,
  localPlayerId: 0,
  engine: null,
  networkGameId: null,
  networkGameCode: null,
  networkSync: null,

  setAIThinking: (playerId: PlayerId | null) => {
    set({ isAIThinking: playerId !== null, aiThinkingPlayerId: playerId });
  },

  downloadGameLog: () => {
    const { engine } = get();
    if (!engine) {
      console.warn('No engine available to download log');
      return;
    }

    try {
      const logJSON = engine.logger.exportToJSON();
      const blob = new Blob([logJSON], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `skirmish-log-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Game log downloaded successfully');
    } catch (error) {
      console.error('Failed to download game log:', error);
    }
  },

  initGame: (localPlayerId: PlayerId, mode: 'vs-ai' | 'human-vs-human' | 'god-mode' = 'vs-ai') => {
    // Determine controllers based on mode
    const isHumanVsHuman = mode === 'human-vs-human' || mode === 'god-mode';
    
    // Create controllers
    let controller0, controller1;
    
    // Create controllers - temporarily with null engine
    let claudeAI0: ClaudeAI | null = null;
    let claudeAI1: ClaudeAI | null = null;
    
    if (isHumanVsHuman) {
        controller0 = new HumanController(0);
        controller1 = new HumanController(1);
    } else {
        // vs-ai mode - create ClaudeAI instance
        if (localPlayerId === 0) {
          controller0 = new HumanController(0);
          claudeAI1 = new ClaudeAI(1);
          controller1 = new AIController(1, null as any, claudeAI1);
        } else {
          claudeAI0 = new ClaudeAI(0);
          controller0 = new AIController(0, null as any, claudeAI0);
          controller1 = new HumanController(1);
        }
    }

    // Create engine
    const engine = new GameEngine(controller0, controller1);

    // Set engine reference in AI controllers and ClaudeAI instances
    if (controller0 instanceof AIController) {
      (controller0 as any).engine = engine;
    }
    if (controller1 instanceof AIController) {
      (controller1 as any).engine = engine;
    }
    
    // Set engine reference in ClaudeAI instances for proper legal action validation
    if (claudeAI0) {
      claudeAI0.setEngine(engine);
    }
    if (claudeAI1) {
      claudeAI1.setEngine(engine);
    }

    // Get deck from deck builder
    const deckBuilderState = useDeckStore.getState();
    const deckList: string[] = [];
    deckBuilderState.deck.forEach(entry => {
      for (let i = 0; i < entry.count; i++) {
        deckList.push(entry.cardId);
      }
    });

    // Create decks - use deck builder's deck for player, starter deck for opponent
    let player0Deck = createStarter1Deck(0, engine);
    const player1Deck = createStarter2Deck(1, engine);

    //player0Deck = createTestDeck(0, engine);

    // Initialize game with leaders (cast to any to bypass type mismatch between Card class and Card interface)
    // Player 0 gets Sage (1 charge, draw 1 card), Player 1 gets Warlord (2 charges, deal 1 damage)
    engine.initializeGame(player0Deck as any, player1Deck as any, 'sage', 'warlord');

    // Subscribe to ALL engine events (this is how UI stays in sync)
    engine.onEvent((event: GameEvent) => {
      const currentState = get();
      const newEventLog = [...currentState.eventLog, event];

      // Console logging with perspective awareness
      const localPlayerId = currentState.localPlayerId;
      const getPlayerLabel = (playerId: any) => {
        if (playerId === undefined || playerId === null) return '';
        return playerId === localPlayerId ? 'YOU' : 'OPPONENT';
      };

      // Handle INPUT_REQUIRED events
      if (event.type === 'INPUT_REQUIRED') {
        console.log(`[Event] INPUT_REQUIRED for ${getPlayerLabel(event.playerId)}`, event.inputRequest);
        set({
          eventLog: newEventLog,
          pendingInputRequest: event.inputRequest,
          pendingInputPlayerId: event.playerId,
        });
        
        // Notify controllers so AI can auto-select
        const { localController, opponentController } = get();
        if (localController && 'onEvent' in localController) {
          localController.onEvent(event);
        }
        if (opponentController && 'onEvent' in opponentController) {
          opponentController.onEvent(event);
        }
        
        return;
      }

      // Update game state snapshot when engine emits it
      if (event.type === 'STATE_SNAPSHOT') {
        console.log(`[Event] STATE_SNAPSHOT - Current turn: ${getPlayerLabel(event.state.currentPlayer)}`);
        set({
          eventLog: newEventLog,
          gameState: event.state,
          pendingInputRequest: null,
          pendingInputPlayerId: null,
        });
      } else if ('playerId' in event) {
        // Events with player ID - show perspective-aware label
        console.log(`[Event] ${event.type} by ${getPlayerLabel((event as any).playerId)}`, event);
        set({ eventLog: newEventLog });
      } else {
        // System events
        console.log(`[Event] ${event.type}`, event);
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
      gameMode: mode,
    });
  },

  initNetworkGame: async (localPlayerId: PlayerId, action: 'create' | string) => {
    try {
      const { firebaseConfig, FIREBASE_CONFIGURED } = await import('../../config/firebase.config');
      const { NetworkGameManager } = await import('../../network/NetworkGameManager');
      
      if (!FIREBASE_CONFIGURED) {
        alert('Firebase is not configured!\n\nPlease edit src/config/firebase.config.ts with your Firebase credentials.');
        return;
      }

      const manager = new NetworkGameManager(firebaseConfig);

      // Get deck from deck builder
      const deckBuilderState = useDeckStore.getState();
      const deckList: string[] = [];
      deckBuilderState.deck.forEach(entry => {
        for (let i = 0; i < entry.count; i++) {
          deckList.push(entry.cardId);
        }
      });

      // Create starter deck IDs for opponent (we don't know their deck yet)
      const starterDeckList = [
        'scout', 'scout',
        'engineer', 'acolyte', 'mimic',
        'priest', 'bard', 'roots', 'wizard',
        'archer', 'archer',
        'turret', 'rookie', 'knight', 'sentinel',
        'champion', 'champion',
        'hunter', 'noble', 'ranger',
        'strike', 'strike',
        'unsummon', 'seed', 'energize',
      ];

      if (action === 'create') {
        // Create a new network game
        const { engine, gameId, code, networkSync, deck0Ids, deck1Ids } = await manager.createGame(
          localPlayerId,
          deckList,
          starterDeckList
        );

        // Subscribe to ready state to know when to start game
        const firebase = manager.getFirebaseService();
        firebase.subscribeToReadyState(gameId, async (gameData: any) => {
          const bothReady = gameData.player0Ready && gameData.player1Ready;
          const gameStarted = gameData.gameStarted;
          
          if (bothReady && !gameStarted) {
            // Both players connected! Set game as started
            const gameStartedRef = await firebase.getGame(gameId);
            if (gameStartedRef && !gameStartedRef.gameStarted) {
              // Use setPlayerReady logic which handles setting gameStarted
              await firebase.setPlayerReady(gameId, localPlayerId);
            }
          }
          
          if (gameStarted && !get().gameState) {
            // Game is started - initialize the engine!
            const deck0 = createDeck(deck0Ids, 0, engine);
            const deck1 = createDeck(deck1Ids, 1, engine);
            
            // Debug: Verify deterministic card IDs
            console.log('[CARD IDs] Player 0 deck:', deck0.map(c => c.id).slice(0, 5), '...');
            console.log('[CARD IDs] Player 1 deck:', deck1.map(c => c.id).slice(0, 5), '...');
            
            await engine.initializeGame(deck0 as any, deck1 as any);
            
            // Update state to trigger transition to game screen
            set({ gameState: engine.state });
          }
        });

        // Subscribe to engine events
        engine.onEvent((event: GameEvent) => {
          const currentState = get();
          const newEventLog = [...currentState.eventLog, event];
          
          const getPlayerLabel = (playerId: any) => {
            if (playerId === undefined || playerId === null) return '';
            return playerId === localPlayerId ? 'YOU' : 'OPPONENT';
          };

          if (event.type === 'INPUT_REQUIRED') {
            console.log(`[Event] INPUT_REQUIRED for ${getPlayerLabel(event.playerId)}`, event.inputRequest);
            set({
              eventLog: newEventLog,
              pendingInputRequest: event.inputRequest,
              pendingInputPlayerId: event.playerId,
            });
            return;
          }

          if (event.type === 'STATE_SNAPSHOT') {
            console.log(`[Event] STATE_SNAPSHOT - Current turn: ${getPlayerLabel(event.state.currentPlayer)}`);
            set({
              eventLog: newEventLog,
              gameState: event.state,
              pendingInputRequest: null,
              pendingInputPlayerId: null,
            });
          } else if ('playerId' in event) {
            console.log(`[Event] ${event.type} by ${getPlayerLabel((event as any).playerId)}`, event);
            set({ eventLog: newEventLog });
          } else {
            console.log(`[Event] ${event.type}`, event);
            set({ eventLog: newEventLog });
          }
        });

        // Set up desync handler
        networkSync.onDesync((desyncEvent: any) => {
          console.error('DESYNC DETECTED', desyncEvent);
          alert(`Game state mismatch detected!\n\nExpected: ${desyncEvent.expected}\nActual: ${desyncEvent.actual}\n\nThe game may be out of sync.`);
        });

        // Set initial state (waiting for opponent to join)
        set({
          engine,
          localController: localPlayerId === 0 ? new HumanController(0) : new HumanController(1),
          opponentController: null,
          localPlayerId,
          gameState: null, // Will be set when gameStarted becomes true
          eventLog: [],
          gameMode: 'network',
          networkGameId: gameId,
          networkGameCode: code,
          networkSync,
        });

      } else {
        // Join existing game by code
        const gameCode = action;
        
        const { engine, gameId, code, networkSync, deck0Ids, deck1Ids } = await manager.joinGameByCode(
          gameCode,
          localPlayerId,
          deckList
        );

        // Subscribe to ready state to know when to start game
        const firebase = manager.getFirebaseService();
        firebase.subscribeToReadyState(gameId, async (gameData: any) => {
          const currentState = get();
          const bothReady = gameData.player0Ready && gameData.player1Ready;
          const gameStarted = gameData.gameStarted;
          
          if (bothReady && !gameStarted) {
            // Both players connected! setPlayerReady handles setting gameStarted
            // This was already called when joining, it will trigger on second player
          }
          
          if (gameStarted && !currentState.gameState) {
            // Game is started - initialize the engine!
            const deck0 = createDeck(deck0Ids, 0, engine);
            const deck1 = createDeck(deck1Ids, 1, engine);
            
            // Debug: Verify deterministic card IDs
            console.log('[CARD IDs] Player 0 deck:', deck0.map(c => c.id).slice(0, 5), '...');
            console.log('[CARD IDs] Player 1 deck:', deck1.map(c => c.id).slice(0, 5), '...');
            
            await engine.initializeGame(deck0 as any, deck1 as any);
            
            // Update state to trigger transition to game screen
            set({ gameState: engine.state });
          }
        });

        // Subscribe to engine events
        engine.onEvent((event: GameEvent) => {
          const currentState = get();
          const newEventLog = [...currentState.eventLog, event];
          
          const getPlayerLabel = (playerId: any) => {
            if (playerId === undefined || playerId === null) return '';
            return playerId === localPlayerId ? 'YOU' : 'OPPONENT';
          };

          if (event.type === 'INPUT_REQUIRED') {
            console.log(`[Event] INPUT_REQUIRED for ${getPlayerLabel(event.playerId)}`, event.inputRequest);
            set({
              eventLog: newEventLog,
              pendingInputRequest: event.inputRequest,
              pendingInputPlayerId: event.playerId,
            });
            return;
          }

          if (event.type === 'STATE_SNAPSHOT') {
            console.log(`[Event] STATE_SNAPSHOT - Current turn: ${getPlayerLabel(event.state.currentPlayer)}`);
            set({
              eventLog: newEventLog,
              gameState: event.state,
              pendingInputRequest: null,
              pendingInputPlayerId: null,
            });
          } else if ('playerId' in event) {
            console.log(`[Event] ${event.type} by ${getPlayerLabel((event as any).playerId)}`, event);
            set({ eventLog: newEventLog });
          } else {
            console.log(`[Event] ${event.type}`, event);
            set({ eventLog: newEventLog });
          }
        });

        // Set up desync handler
        networkSync.onDesync((desyncEvent: any) => {
          console.error('DESYNC DETECTED', desyncEvent);
          alert(`Game state mismatch detected!\n\nExpected: ${desyncEvent.expected}\nActual: ${desyncEvent.actual}\n\nThe game may be out of sync.`);
        });

        // Set initial state (waiting for game to start)
        set({
          engine,
          localController: localPlayerId === 0 ? new HumanController(0) : new HumanController(1),
          opponentController: null,
          localPlayerId,
          gameState: null, // Will be set when gameStarted becomes true
          eventLog: [],
          gameMode: 'network',
          networkGameId: gameId,
          networkGameCode: code,
          networkSync,
        });
      }

    } catch (error) {
      console.error('Network game initialization failed:', error);
      alert('Failed to create/join network game:\n\n' + (error as Error).message);
    }
  },
}));

// Expose store to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__GAME_STORE__ = useGameStore;
  
  (window as any).printGameState = () => {
    const state = useGameStore.getState();
    const gameState = state.gameState || state.engine?.state;
    
    if (!gameState) {
      console.log('No game state available');
      return;
    }

    console.group('=== GAME STATE SNAPSHOT ===');
    console.log('Raw State:', gameState);
    console.log('Current Player:', gameState.currentPlayer);
    console.log('Skirmish:', gameState.currentSkirmish);
    
    console.group('Terrains');
    gameState.terrains.forEach((terrain: any, index: number) => {
      console.group(`Terrain ${index}: ${terrain.id}`);
      console.log('Winner:', terrain.winner === null ? 'None' : `Player ${terrain.winner}`);
      
      [0, 1].forEach(pid => {
        const slot = terrain.slots[pid as 0|1];
        const unit = slot.unit;
        console.group(`Player ${pid} Slot`);
        console.log('Modifier:', slot.modifier);
        if (unit) {
          console.log('Unit:', unit.name, `(ID: ${unit.id})`);
          console.log('Base Power:', unit.basePower || unit.originalPower);
          console.log('Effective Power:', (unit as any).power);
        } else {
          console.log('Empty');
        }
        console.groupEnd();
      });
      console.groupEnd();
    });
    console.groupEnd();
    
    console.groupEnd();
    return gameState;
  };

  (window as any).triggerGameOver = (winner: 0 | 1) => {
    const state = useGameStore.getState();
    const engine = state.engine;
    
    if (!engine) {
      console.error('No game engine available');
      return;
    }

    console.log(`Triggering game over with winner: Player ${winner}`);
    engine.state.matchWinner = winner;
    engine.state.players[winner].skirmishesWon = 2;
    engine.state.players[winner === 0 ? 1 : 0].skirmishesWon = 0;
    
    engine.emitEvent({
      type: 'STATE_SNAPSHOT',
      state: engine.state,
    });

    console.log('Game over triggered! Check the UI.');
  };
}