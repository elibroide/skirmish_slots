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
  // Position in Screen Space
  x: number;
  y: number;
  width: number;
  height: number;
  status: SlotStatus;
  
  // Power Circle
  power: number;
  powerState: 'none' | 'contested' | 'winning';
  modifier: number;
  
  // Slot Content
  content: {
    cardId: string;
    instance?: CardInstance;
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
    wins: number;
    turnStatus: TurnStatus;
    hand: CardInstance[];
}

import { mapEngineStateToStore } from '../utils/stateMapper';
import { GameEvent } from '@skirmish/engine';

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
  isGameStarted: boolean;
  currentTurn: 'player' | 'opponent' | 'none';
  
  hoveredCard: CardInstance | null;
  
  // Opponent Hand
  opponentCards: any[];
  setOpponentCards: (cards: any[]) => void;

  // Event Queue
  eventQueue: GameEvent[];
  enqueueEvent: (event: GameEvent) => void;
  consumeEvent: () => void;
  clearEventQueue: () => void;
  
  // Actions
  registerSlot: (slot: Omit<BoardSlot, 'id'>) => void;
  updateSlotPosition: (playerId: PlayerId, terrainId: TerrainId, x: number, y: number, width: number, height: number) => void;
  
  // Interactions
  setHoveredCard: (card: CardInstance | null) => void;
  setPlayerWins: (playerId: PlayerId, wins: number) => void;
  setTurn: (turn: 'player' | 'opponent') => void;
  setGameStarted: (started: boolean) => void;
  
  // Slot Visuals 
  setSlotStatus: (targets: number[] | { playerId: PlayerId, terrainId: TerrainId }[], status: 'idle' | 'showDrop' | 'showTarget') => void;
  setSlotPower: (targets: { playerId: PlayerId, terrainId: TerrainId }[], power: number, state: 'none' | 'contested' | 'winning') => void;
  setSlotModifier: (targets: { playerId: PlayerId, terrainId: TerrainId }[], modifier: number) => void;
  resetSlotStatus: () => void;
  
  removeCardFromHand: (playerId: PlayerId, cardId: string) => void;
  addCardToHand: (playerId: PlayerId, card: CardInstance) => void;
  syncHandFromEngine: (playerId: PlayerId, engineHand: any[]) => void;

  occupySlot: (playerId: PlayerId, terrainId: TerrainId, cardId: string, instance?: CardInstance) => void;
  clearSlot: (playerId: PlayerId, terrainId: TerrainId) => void;
  setPlayerTurnStatus: (playerId: PlayerId, status: TurnStatus) => void;

  // Settings
  updateBoardSettings: (settings: Partial<BoardSettings>) => void;
  resetBoardSettings: () => void;
  setDragState: (active: boolean, cardId?: string) => void;
  
  // UI Interaction
  setHoveredSlot: (slotId: number | { playerId: PlayerId, terrainId: TerrainId } | null) => void;
  hoveredSlot: number | null;

  // Engine Integration
  setInitialGameState: (localPlayerId: PlayerId, gameState: any, hands: { p0: any[], p1: any[] }, mode: string) => void;
  localPlayerId?: PlayerId;
  gameMode?: string;

  // Input & AI State
  pendingInputRequest: any | null; 
  pendingInputPlayerId: PlayerId | null;
  isAIThinking: boolean;
  aiThinkingPlayerId: PlayerId | null;
  
  playableCardIds: string[]; // Cards that can be played this turn
  setPlayableCards: (ids: string[]) => void;
  
  downloadGameLog: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
    // Initial State
    players: {
        0: { slots: {} as Record<TerrainId, BoardSlot>, wins: 0, turnStatus: 'none', hand: [] },
        1: { slots: {} as Record<TerrainId, BoardSlot>, wins: 0, turnStatus: 'none', hand: [] }
    },
    currentTurn: 'none',
    gameState: null,
    isGameStarted: false,
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
    playableCardIds: [],
    setPlayableCards: (ids) => set({ playableCardIds: ids }),
    
    downloadGameLog: () => { console.log('Download Log placeholder'); },

    hoveredCard: null,
    hoveredSlot: null,
    
    // Event Queue Implementation
    eventQueue: [],
    enqueueEvent: (event) => set((state) => ({ eventQueue: [...state.eventQueue, event] })),
    consumeEvent: () => set((state) => ({ eventQueue: state.eventQueue.slice(1) })),
    clearEventQueue: () => set({ eventQueue: [] }),

    setInitialGameState: (localPlayerId, gameState, hands, mode) => {
        set({
            localPlayerId,
            gameMode: mode,
            isGameStarted: false,
            currentTurn: 'none',
            gameState: mapEngineStateToStore(gameState), 
            players: {
                ...get().players, 
                0: { 
                    ...get().players[0], 
                    hand: hands.p0 || [],
                    turnStatus: 'none',
                    wins: gameState.players[0].skirmishesWon
                },
                1: { 
                    ...get().players[1], 
                    hand: hands.p1 || [],
                    turnStatus: 'none',
                    wins: gameState.players[1].skirmishesWon
                }
            }
        });
    },

    setGameStarted: (started: boolean) => set({ isGameStarted: started }),

    opponentCards: [],
    setOpponentCards: (cards) => set({ opponentCards: cards }),

    // Actions
    registerSlot: (slotData) => set((state) => {
        const { playerId, terrainId } = slotData;
        const newPlayers = { ...state.players };
        
        if (!newPlayers[playerId]) newPlayers[playerId] = { slots: {} as Record<TerrainId, BoardSlot>, wins: 0, turnStatus: 'none', hand: [] };

        newPlayers[playerId].slots = {
            ...newPlayers[playerId].slots,
            [terrainId]: {
                ...slotData,
                modifier: 0,
                id: `${playerId}_${terrainId}`
            } as BoardSlot
        };

        return { players: newPlayers };
    }),

    updateSlotPosition: (playerId, terrainId, x, y, width, height) => set((state) => {
        const player = state.players[playerId];
        if (!player || !player.slots[terrainId]) return {};

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

    addCardToHand: (playerId, card) => set(produce((state: GameStoreState) => {
        // Prevent duplicates (idempotency check)
        if (state.players[playerId].hand.some(c => c.id === card.id)) {
            console.warn(`[GameStore] Ignored duplicate card add: ${card.id}`);
            return;
        }
        state.players[playerId].hand.push(card);
    })),

    occupySlot: (playerId: PlayerId, terrainId: TerrainId, cardId: string, instance?: CardInstance) => set((state) => {
        const p = state.players[playerId];
        if (!p || !p.slots[terrainId]) return {}; // No change

        return {
            players: {
                ...state.players,
                [playerId]: {
                    ...p,
                    slots: {
                        ...p.slots,
                        [terrainId]: {
                            ...p.slots[terrainId],
                            content: { cardId, instance: instance ? { ...instance, id: instance.id } : undefined },
                            status: 'idle'
                        }
                    }
                }
            }
        };
    }),

    syncHandFromEngine: (playerId, engineHand) => set(produce((state: GameStoreState) => {
        console.log(`[GameStore] Syncing Hand for P${playerId}. Engine Cards: ${engineHand.length}`);
        state.players[playerId].hand = engineHand;
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

    updateBoardSettings: (settings) => set(produce((state: GameStoreState) => {
        state.boardSettings = { ...state.boardSettings, ...settings };
    })),
    
    resetBoardSettings: () => set(produce((state: GameStoreState) => {
        state.boardSettings = defaultBoardSettings;
    })),

    setDragState: (active, cardId) => set(produce((state: GameStoreState) => {
        state.dragState = { ...state.dragState, isDragging: active, cardId: cardId || null };
    })),

    setHoveredSlot: (slotId: number | { playerId: PlayerId, terrainId: TerrainId } | null) => {
        if (slotId === null) set({ hoveredSlot: null });
        else if (typeof slotId === 'number') set({ hoveredSlot: slotId });
        else {
             const { playerId, terrainId } = slotId;
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
                     let pid: PlayerId;
                     let tid: TerrainId;
                     if (target < 5) {
                         pid = opponentId;
                         tid = target as TerrainId;
                     } else {
                         pid = localId;
                         tid = (target - 5) as TerrainId;
                     }
                     updateSlot(pid, tid);
                 } else {
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
