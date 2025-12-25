import { create } from 'zustand';

// Definition of a Board Slot
export type SlotStatus = 'idle' | 'showTarget' | 'showDrop';

export interface BoardSlot {
  id: number;
  owner: 'player' | 'enemy';
  // Position in Screen Space (relative to the Phaser canvas/Game container)
  // We use this to detect drops in React
  x: number;
  y: number;
  width: number;
  height: number;
  status: SlotStatus;
    
  // Is something here?
  content: {
    cardId: string;
    // We can add more unit data here later (hp, attack, art)
  } | null;
}

export interface BoardSettings {
    // Layout Percentages
    slotHeightPercent: number; // 0.0 to 1.0 (relative to Screen Height)
    slotAspectRatio: number;   // Width / Height (e.g. 0.75)
    
    playerSlotGapPercent: number; // 0.0 to 1.0 (relative to Screen Width)
    enemySlotGapPercent: number;  // 0.0 to 1.0 (relative to Screen Width)
    
    playerRowY: number; // 0.0 to 1.0 (percent of screen height)
    enemyRowY: number; // 0.0 to 1.0 (percent of screen height)

    // Card Margins (Percent of Slot Dimension)
    cardMarginTop: number;
    cardMarginBottom: number;
    cardMarginLeft: number;
    cardMarginRight: number;

    // Board Background (Visual)
    boardBgX: number;
    boardBgY: number;
    boardBgScale: number;
    // Frame (Visual)
    frameX: number;
    frameY: number;
    frameScale: number;
}

export interface DragState {
  isDragging: boolean;
  draggedCardId: string | null;
  hoveredSlotId: number | null;
}

interface GameState {
  slots: Record<number, BoardSlot>;
  boardSettings: BoardSettings;
  dragState: DragState;
  
  // Actions
  registerSlot: (slot: BoardSlot) => void;
  occupySlot: (slotId: number, cardId: string) => void;
  clearSlot: (slotId: number) => void;

  updateBoardSettings: (settings: Partial<BoardSettings>) => void;
  
  // Drag Actions
  setDragState: (isDragging: boolean, cardId?: string | null) => void;
  setHoveredSlot: (slotId: number | null) => void;
  
  // Slot Status Actions
  setSlotStatus: (slotIds: number[], status: SlotStatus) => void;
  resetSlotStatus: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  slots: {},
  boardSettings: {
      slotHeightPercent: 0.23,
      slotAspectRatio: 0.77,
      
      playerSlotGapPercent: 0.025,
      enemySlotGapPercent: 0.025,
      
      playerRowY: 0.66,
      enemyRowY: 0.27,
      
      // Margins (Default 5%)
      cardMarginTop: 0.01,
      cardMarginBottom: 0.02,
      cardMarginLeft: 0.02,
      cardMarginRight: 0.02,
      
      // Defaults to centered/full
      boardBgX: 0, // Offset from center
      boardBgY: 40, // Offset from center
      boardBgScale: 0.86, // Multiplier on top of "cover" scale
      frameX: 0,
      frameY: 40,
      frameScale: 0.9,
  },
  
  dragState: {
    isDragging: false,
    draggedCardId: null,
    hoveredSlotId: null
  },

  registerSlot: (slot) => set((state) => {
    const existing = state.slots[slot.id];
    // If status is provided in payload, use it.
    // If NOT provided, keep existing status, or default to 'idle'.
    // BUT BoardScene calls this with `status: slotData?.status || 'idle'`.
    // So if BoardScene passes 'idle' (because it doesn't know better yet), it might overwrite?
    // Actually, BoardScene reads FROM store. So `slotData` IS the store state.
    // So `status: slotData?.status` is correct (persists current).
    
    // However, the original registerSlot implementation I wrote:
    // [slot.id]: { ...slot, status: 'idle' } -> FORCED idle.
    
    // We change it to:
    return {
      slots: {
        ...state.slots,
        [slot.id]: { 
            ...slot, 
            status: slot.status || existing?.status || 'idle' 
        }
      }
    };
  }),

  occupySlot: (slotId, cardId) => set((state) => {
    const slot = state.slots[slotId];
    if (!slot) return state;

    return {
      slots: {
        ...state.slots,
        [slotId]: {
          ...slot,
          content: { cardId }
        }
      }
    };
  }),

  clearSlot: (slotId) => set((state) => {
    const slot = state.slots[slotId];
    if (!slot) return state;

    return {
      slots: {
        ...state.slots,
        [slotId]: {
          ...slot,
          content: null
        }
      }
    };
  }),

  updateBoardSettings: (settings) => set((state) => ({
      boardSettings: { ...state.boardSettings, ...settings }
  })),

  setDragState: (isDragging, cardId = null) => set((state) => ({
    dragState: {
      ...state.dragState,
      isDragging,
      draggedCardId: isDragging ? cardId : null
    }
  })),

  setHoveredSlot: (slotId) => set((state) => ({
    dragState: {
      ...state.dragState,
      hoveredSlotId: slotId
    }
  })),

  setSlotStatus: (slotIds, status) => set((state) => {
      const newSlots = { ...state.slots };
      slotIds.forEach(id => {
          if (newSlots[id]) {
              newSlots[id] = { ...newSlots[id], status };
          }
      });
      return { slots: newSlots };
  }),

  resetSlotStatus: () => set((state) => {
      const newSlots = { ...state.slots };
      Object.keys(newSlots).forEach(key => {
          const id = Number(key);
          newSlots[id] = { ...newSlots[id], status: 'idle' };
      });
      return { slots: newSlots };
  })
}));
