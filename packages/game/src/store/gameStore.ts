import { create } from 'zustand';
import { produce } from 'immer';
import { TerrainId, PlayerId } from '@skirmish/engine';
import type { CardInstance } from '@skirmish/card-maker';
import { GameEngine } from '@skirmish/engine';

// Definition of a Board Slot
export type SlotStatus = 'idle' | 'showTarget' | 'showDrop';

export interface BoardSlot {
  id: string; // "playerId_terrainId"
  playerId: PlayerId;
  terrainId: TerrainId;
  owner: 'player' | 'enemy';
  // Position in Screen Space (relative to the Phaser canvas/Game container)
  // We use this to detect drops in React
  x: number;
  y: number;
  width: number;
  height: number;
  status: SlotStatus;
  
  // Power Circle
  power: number;
  powerState: 'none' | 'contested' | 'winning';
  modifier: number; // Added
  
  // Is something here?
  content: {
    cardId: string;
    instance?: CardInstance;
    // We can add more unit data here later (hp, attack, art)
  } | null;
}

// Config Imports
import { 
    type BoardSettings, 
    type TurnStatus, 
    type WinRecordSettings,
    type HandSettings,
    type TurnIndicatorSettings,
    type AnimationConfig,
    defaultBoardSettings
} from '../config/boardConfig';

export type { BoardSettings, TurnStatus, WinRecordSettings, HandSettings, TurnIndicatorSettings, AnimationConfig };

export interface PlayerStoreData {
    slots: Record<TerrainId, BoardSlot>;
    wins: number; // Track rounds won per player
    turnStatus: TurnStatus;
    hand: CardInstance[];
}

// 
// HYDRATION IMPORT
//
import { hydrateCard, hydrateHand } from '../ui/utils/cardHydration';
import { createStarter1Deck } from '@skirmish/engine';
import { mapEngineStateToStore } from '../utils/stateMapper';
import { GameEvent } from '@skirmish/engine';

// GameState Interface merged below

// Config Types Removed (Moved to boardConfig.ts)

export interface DragState {
  isDragging: boolean;
  cardId: string | null;
  hoveredSlot: { playerId: PlayerId, terrainId: TerrainId } | null;
}

interface GameStoreState {
  // Current Board State
  players: Record<PlayerId, PlayerStoreData>;
  gameState: any; // Engine State

  boardSettings: BoardSettings;
  dragState: DragState;
  
  // Game Flow
  currentTurn: 'player' | 'opponent'; // Added
  
  hoveredCard: CardInstance | null; // Added
  
  // Opponent Hand
  opponentCards: any[]; // Using any[] temporarily if CardInstance not imported, or update import
  setOpponentCards: (cards: any[]) => void;

  // Event Queue (New)
  eventQueue: GameEvent[];
  enqueueEvent: (event: GameEvent) => void;
  consumeEvent: () => void; // Removes the first event
  clearEventQueue: () => void;

  
  // Actions
  registerSlot: (slot: Omit<BoardSlot, 'id'>) => void;
  updateSlotPosition: (playerId: PlayerId, terrainId: TerrainId, x: number, y: number, width: number, height: number) => void;
  
  // Interactions
  // Actions & State
  setHoveredCard: (card: CardInstance | null) => void;
  setPlayerWins: (playerId: PlayerId, wins: number) => void;
  setTurn: (turn: 'player' | 'opponent') => void;
  
  // Slot Visuals 
  setSlotStatus: (targets: number[] | { playerId: PlayerId, terrainId: TerrainId }[], status: 'idle' | 'showDrop' | 'showTarget') => void;
  setSlotPower: (targets: { playerId: PlayerId, terrainId: TerrainId }[], power: number, state: 'none' | 'contested' | 'winning') => void;
  setSlotModifier: (targets: { playerId: PlayerId, terrainId: TerrainId }[], modifier: number) => void;
  resetSlotStatus: () => void; // Reset all to idle
  
  removeCardFromHand: (playerId: PlayerId, cardId: string) => void;
  addCardToHand: (playerId: PlayerId, card: CardInstance) => void;
  // Helper: Map Engine State to Store State
  syncHandFromEngine: (playerId: PlayerId, engineHand: any[]) => void;

  occupySlot: (playerId: PlayerId, terrainId: TerrainId, cardId: string, instance?: CardInstance) => void;
  clearSlot: (playerId: PlayerId, terrainId: TerrainId) => void;
  setPlayerTurnStatus: (playerId: PlayerId, status: TurnStatus) => void;

  // Settings
  updateBoardSettings: (settings: Partial<BoardSettings>) => void;
  setDragState: (active: boolean, cardId?: string) => void;
  
  // UI Interaction
  setHoveredSlot: (slotId: number | { playerId: PlayerId, terrainId: TerrainId } | null) => void;
  // setSlotStatus: (slotIds: number[], status: SlotStatus) => void; // Merged above
  hoveredSlot: number | null;

  // Engine Integration
  // engine?: GameEngine; -- Removed to avoid freezing. Use via engineInstance.ts logic/handlers.
  setInitialGameState: (localPlayerId: PlayerId, gameState: any, hands: { p0: any[], p1: any[] }, mode: string) => void;
  localPlayerId?: PlayerId;
  gameMode?: string;

  // Input & AI State
  pendingInputRequest: any | null; 
  pendingInputPlayerId: PlayerId | null;
  isAIThinking: boolean;
  aiThinkingPlayerId: PlayerId | null;
  downloadGameLog: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
    // Initial State
    players: {
        0: { slots: {} as Record<TerrainId, BoardSlot>, wins: 0, turnStatus: 'none', hand: [] },
        1: { slots: {} as Record<TerrainId, BoardSlot>, wins: 0, turnStatus: 'none', hand: [] }
    },
    currentTurn: 'player', // Default
    gameState: null,
    boardSettings: defaultBoardSettings,
    dragState: {
        isDragging: false,
        cardId: null,
        hoveredSlot: null
    },

    // Input & AI Initialization
    pendingInputRequest: null,
    pendingInputPlayerId: null,
    isAIThinking: false,
    aiThinkingPlayerId: null,
    downloadGameLog: () => { console.log('Download Log placeholder'); },

    hoveredCard: null,

    hoveredSlot: null,
    
    // Event Queue Implementation
    eventQueue: [],
    enqueueEvent: (event) => set((state) => {
        // HYDRATION TRIGGER: Update hand on relevant events
        const newEventLog = [...state.eventQueue, event];
        
        // We can optimistically update hand here if needed, or wait for consumtion?
        // Actually, for immediate visual feedback (like draw), we should update the store's hand state now.
        // But let's check if we have access to the engine state? 
        // The engine emits the event, meaning its state might be updated.
        // However, we only have reference to `state.engine`.
        
        // Let's implement a specific listener in initGame that calls a store *action* to sync hand.
        // But for now, we'll do it lazily or via the standard event loop if the engine state is attached.
        
        // Actually, initGame sets up the listener. Let's look at initGame below.
        
        return { eventQueue: newEventLog };
    }),
    consumeEvent: () => set((state) => ({ eventQueue: state.eventQueue.slice(1) })),
    clearEventQueue: () => set({ eventQueue: [] }),

    // 
    // INIT GAME IMPLEMENTATION - REMOVED
    //
    setInitialGameState: (localPlayerId, gameState, hands, mode) => {
        const getTurnStatus = (pid: number): TurnStatus => {
            if (gameState.players[pid].isDone) return 'done';
            if (gameState.currentPlayer === pid) return 'turn';
            return 'none';
        };

        set({
            localPlayerId,
            gameMode: mode,
            // Use Mapper to create a clean, circular-free copy
            gameState: mapEngineStateToStore(gameState), 
            currentTurn: gameState.currentPlayer === 0 ? 'player' : 'opponent',
            players: {
                ...get().players, 
                0: { 
                    ...get().players[0], 
                    hand: hydrateHand(hands.p0),
                    turnStatus: getTurnStatus(0),
                    wins: gameState.players[0].skirmishesWon
                },
                1: { 
                    ...get().players[1], 
                    hand: hydrateHand(hands.p1),
                    turnStatus: getTurnStatus(1),
                    wins: gameState.players[1].skirmishesWon
                }
            }
        });
    },

    // Old InitGame Removed

    // Network Stubs
    // Network Stubs Removed

    // Opponent Hand Implementation
    opponentCards: [],
    setOpponentCards: (cards) => set({ opponentCards: cards }),
    // Actions
    registerSlot: (slotData) => set((state) => {
        const { playerId, terrainId } = slotData;
        const newPlayers = { ...state.players };
        
        // Ensure player structure exists (it should from initial state, but helpful for safety)
        if (!newPlayers[playerId]) newPlayers[playerId] = { slots: {} as Record<TerrainId, BoardSlot>, wins: 0, turnStatus: 'none', hand: [] };

        newPlayers[playerId].slots = {
            ...newPlayers[playerId].slots,
            [terrainId]: {
                ...slotData,
                modifier: 0, // Initialize
                id: `${playerId}_${terrainId}` // Set the composite ID here
            } as BoardSlot
        };

        return { players: newPlayers };
    }),

    updateSlotPosition: (playerId, terrainId, x, y, width, height) => set((state) => {
        const player = state.players[playerId];
        if (!player || !player.slots[terrainId]) return {}; // No change

        const updatedSlots = {
            ...player.slots,
            [terrainId]: { ...player.slots[terrainId], x, y, width, height }
        };

        return {
            players: {
                ...state.players,
                [playerId]: { ...player, slots: updatedSlots }
            }
        };
    }),
    
    // Old Duplicate Action Removed

    // Restored Actions
    setHoveredCard: (card) => set({ hoveredCard: card }),

    setPlayerWins: (playerId, wins) => set((state) => ({
        players: {
            ...state.players,
            [playerId]: { ...state.players[playerId], wins }
        }
    })),

    setTurn: (turn) => set({ currentTurn: turn }),

    setSlotPower: (targets, power, powerState) => set((state) => {
        const newPlayers = { ...state.players };
        targets.forEach(({ playerId, terrainId }) => {
            if (newPlayers[playerId] && newPlayers[playerId].slots[terrainId]) {
                newPlayers[playerId] = { 
                    ...newPlayers[playerId],
                    slots: {
                        ...newPlayers[playerId].slots,
                        [terrainId]: { ...newPlayers[playerId].slots[terrainId], power, powerState }
                    }
                };
            }
        });
        return { players: newPlayers };
    }),

    setSlotModifier: (targets, modifier) => set((state) => {
        const newPlayers = { ...state.players };
        targets.forEach(({ playerId, terrainId }) => {
            if (newPlayers[playerId] && newPlayers[playerId].slots[terrainId]) {
                newPlayers[playerId] = { 
                    ...newPlayers[playerId],
                    slots: {
                        ...newPlayers[playerId].slots,
                        [terrainId]: { ...newPlayers[playerId].slots[terrainId], modifier }
                    }
                };
            }
        });
        return { players: newPlayers };
    }),

    // Old resetSlotStatus Removed

    addCardToHand: (playerId, card) => set(produce((state: GameStoreState) => {
        state.players[playerId].hand.push(card);
    })),

    occupySlot: (playerId: PlayerId, terrainId: TerrainId, cardId: string, instance?: CardInstance) => set((state) => {
        const p = state.players[playerId];
        if (!p || !p.slots[terrainId]) return {};

        return {
            players: {
                ...state.players,
                [playerId]: {
                    ...p,
                    slots: {
                        ...p.slots,
                        [terrainId]: {
                            ...p.slots[terrainId],
                            content: { cardId, instance },
                            status: 'idle'
                        }
                    }
                }
            }
        };
    }),

    syncHandFromEngine: (playerId, engineHand) => set(produce((state: GameStoreState) => {
        const hydrated = hydrateHand(engineHand);
        console.log(`[GameStore] Syncing Hand for P${playerId}. Engine Cards: ${engineHand.length}, Hydrated: ${hydrated.length}`);
        state.players[playerId].hand = hydrated;
    })),

    removeCardFromHand: (playerId, cardId) => set((state) => {
        const p = state.players[playerId];
        if (!p) return {};
        return {
            players: {
                ...state.players,
                [playerId]: {
                    ...p,
                    hand: p.hand.filter(c => c.id !== cardId)
                }
            }
        };
    }),

    clearSlot: (playerId, terrainId) => set((state) => {
        const p = state.players[playerId];
        if (!p || !p.slots[terrainId]) return {};

        return {
            players: {
                ...state.players,
                [playerId]: {
                    ...p,
                    slots: {
                        ...p.slots,
                        [terrainId]: {
                            ...p.slots[terrainId],
                            content: null
                        }
                    }
                }
            }
        };
    }),

    setPlayerTurnStatus: (playerId, status) => set((state) => ({
        players: {
            ...state.players,
            [playerId]: { ...state.players[playerId], turnStatus: status }
        }
    })),

    updateBoardSettings: (settings) => set((state) => ({
        boardSettings: { ...state.boardSettings, ...settings }
    })),

    setDragState: (active, cardId) => set((state) => ({
        dragState: { ...state.dragState, isDragging: active, draggedCardId: cardId || null }
    })),

    setHoveredSlot: (slotId: number | { playerId: PlayerId, terrainId: TerrainId } | null) => {
        if (slotId === null) set({ hoveredSlot: null });
        else if (typeof slotId === 'number') set({ hoveredSlot: slotId });
        else {
             // Convert object to number ID (0-9)
             // Enemy (Opponent, usually ID 1) -> Indices 0-4
             // Player (Local, usually ID 0) -> Indices 5-9
             // NOTE: This assumes perspective of player 0 being "bottom".
             const { playerId, terrainId } = slotId;
             // If player is 0, status is 5+tId. If player is 1, status is tId.
             // This logic depends on BoardScene mapping.
             const numId = playerId === 0 ? 5 + terrainId : terrainId;
             set({ hoveredSlot: numId });
        }
    },

    setSlotStatus: (targets, status) => set((state) => {
         const localId = state.localPlayerId ?? 0;
         const opponentId = localId === 0 ? 1 : 0;
         const newPlayers = { ...state.players };
         
         // Clone to avoid mutation
         newPlayers[0] = { ...newPlayers[0], slots: { ...newPlayers[0].slots } };
         newPlayers[1] = { ...newPlayers[1], slots: { ...newPlayers[1].slots } };

         const updateSlot = (pid: PlayerId, tid: TerrainId) => {
              if (newPlayers[pid] && newPlayers[pid].slots[tid]) {
                  newPlayers[pid].slots[tid] = { ...newPlayers[pid].slots[tid], status: status };
              }
         };

         if (Array.isArray(targets)) {
             targets.forEach(target => {
                 if (typeof target === 'number') {
                     // Numeric ID logic
                     let pid: PlayerId;
                     let tid: TerrainId;
                     // 0-4: Opponent (Player 1 if local is 0)
                     // 5-9: Player (Player 0 if local is 0)
                     if (target < 5) {
                         pid = opponentId;
                         tid = target as TerrainId;
                     } else {
                         pid = localId;
                         tid = (target - 5) as TerrainId;
                     }
                     updateSlot(pid, tid);
                 } else {
                     // Object logic
                     updateSlot(target.playerId, target.terrainId);
                 }
             });
         }
         
         return { ...state, players: newPlayers };
    }),

    resetSlotStatus: () => set((state) => {
        const resetSlots = (slots: Record<TerrainId, BoardSlot>) => {
            const newSlots = { ...slots };
            (Object.keys(newSlots) as unknown as TerrainId[]).forEach(tid => {
                newSlots[tid] = { ...newSlots[tid], status: 'idle' };
            });
            return newSlots;
        };
        
        return {
            players: {
                0: { ...state.players[0], slots: resetSlots(state.players[0].slots) },
                1: { ...state.players[1], slots: resetSlots(state.players[1].slots) }
            }
        };
    }),
}));
