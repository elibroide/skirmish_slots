import { create } from 'zustand';
import type { GameState, GameEvent, SlotId } from '../../engine/types';
import { GameEngine, initializeGame } from '../../engine';

interface GameStore {
  engine: GameEngine | null;
  gameState: GameState | null;
  selectedCardId: string | null;
  isProcessing: boolean;
  gameLog: GameEvent[];

  // Actions
  initGame: () => void;
  playCard: (cardId: string, slotId?: SlotId) => void;
  pass: () => void;
  selectCard: (cardId: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  engine: null,
  gameState: null,
  selectedCardId: null,
  isProcessing: false,
  gameLog: [],

  initGame: () => {
    // Create a new game with starter decks
    const engine = initializeGame();

    // Subscribe to all game events
    engine.onEvent((event) => {
      const currentLog = get().gameLog;

      // Add to log (keep last 100 events)
      const newLog = [...currentLog, event].slice(-100);

      // Update state snapshot when received
      if (event.type === 'STATE_SNAPSHOT') {
        set({
          gameState: event.state,
          gameLog: newLog,
          isProcessing: false,
        });
      } else {
        set({ gameLog: newLog });
      }
    });

    set({
      engine,
      gameState: engine.state,
      selectedCardId: null,
      isProcessing: false,
      gameLog: [],
    });
  },

  playCard: (cardId: string, slotId?: SlotId) => {
    const { engine, gameState, selectedCardId } = get();
    if (!engine || !gameState) return;

    set({ isProcessing: true });

    try {
      // Determine which card to play
      const cardToPlay = cardId || selectedCardId;
      if (!cardToPlay) {
        set({ isProcessing: false });
        return;
      }

      // Find the card
      const player = gameState.players[gameState.currentPlayer];
      const card = player.hand.find((c) => c.id === cardToPlay);

      if (!card) {
        console.error('Card not found in hand:', cardToPlay);
        set({ isProcessing: false });
        return;
      }

      // Submit the action
      engine.processAction({
        type: 'PLAY_CARD',
        playerId: gameState.currentPlayer,
        cardId: cardToPlay,
        slotId,
      });

      // Clear selection
      set({ selectedCardId: null });
    } catch (error) {
      console.error('Error playing card:', error);
      set({ isProcessing: false });
    }
  },

  pass: () => {
    const { engine, gameState } = get();
    if (!engine || !gameState) return;

    set({ isProcessing: true });

    try {
      engine.processAction({
        type: 'PASS',
        playerId: gameState.currentPlayer,
      });

      set({ selectedCardId: null });
    } catch (error) {
      console.error('Error passing:', error);
      set({ isProcessing: false });
    }
  },

  selectCard: (cardId: string | null) => {
    set({ selectedCardId: cardId });
  },

  reset: () => {
    set({
      engine: null,
      gameState: null,
      selectedCardId: null,
      isProcessing: false,
      gameLog: [],
    });
  },
}));
