import { create } from 'zustand';

// Definition of a Board Slot
export interface BoardSlot {
  id: number;
  owner: 'player' | 'enemy';
  // Position in Screen Space (relative to the Phaser canvas/Game container)
  // We use this to detect drops in React
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Is something here?
  content: {
    cardId: string;
    // We can add more unit data here later (hp, attack, art)
  } | null;
}

interface GameState {
  slots: Record<number, BoardSlot>;
  
  // Actions
  registerSlot: (slot: BoardSlot) => void;
  occupySlot: (slotId: number, cardId: string) => void;
  clearSlot: (slotId: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  slots: {},

  registerSlot: (slot) => set((state) => ({
    slots: {
      ...state.slots,
      [slot.id]: slot
    }
  })),

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
}));
