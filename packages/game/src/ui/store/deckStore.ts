import { create } from 'zustand';

/**
 * DeckStore - Manages deck building state
 * 
 * Responsibilities:
 * - Track current deck composition
 * - Allow adding/removing cards
 * - Enforce deck construction rules (3 copy limit)
 * - Provide available cards list
 */

export type CardEntry = {
  cardId: string;
  count: number;
};

export type DeckStoreState = {
  deck: CardEntry[];
  
  addCard: (cardId: string) => void;
  removeCard: (cardId: string) => void;
  setDeck: (deck: CardEntry[]) => void;
  resetDeck: () => void;
  
  getCardCount: (cardId: string) => number;
  canAddCard: (cardId: string) => boolean;
  getDeckSize: () => number;
};

const MAX_COPIES_PER_CARD = 3;
const MIN_DECK_SIZE = 20;
const MAX_DECK_SIZE = 30;

export const ALL_CARD_IDS = [
  'acolyte',
  'apprentice',
  'archer',
  'bard',
  'champion',
  'dragon',
  'engineer',
  'ghoul',
  'hunter',
  'knight',
  'mimic',
  'necromancer',
  'noble',
  'priest',
  'ranger',
  'rogue',
  'rookie',
  'roots',
  'scout',
  'sentinel',
  'turret',
  'vampire',
  'veteran',
  'warlock',
  'wizard',
  'assassinate',
  'energize',
  'fireball',
  'repositioning',
  'seed',
  'strike',
  'unsummon',
].sort();

const createStarterDeckList = (): CardEntry[] => {
  return [
    { cardId: 'scout', count: 2 },
    { cardId: 'engineer', count: 1 },
    { cardId: 'acolyte', count: 1 },
    { cardId: 'mimic', count: 1 },
    { cardId: 'priest', count: 1 },
    { cardId: 'bard', count: 1 },
    { cardId: 'roots', count: 1 },
    { cardId: 'wizard', count: 1 },
    { cardId: 'archer', count: 2 },
    { cardId: 'turret', count: 1 },
    { cardId: 'rookie', count: 1 },
    { cardId: 'knight', count: 1 },
    { cardId: 'sentinel', count: 1 },
    { cardId: 'champion', count: 2 },
    { cardId: 'hunter', count: 1 },
    { cardId: 'noble', count: 1 },
    { cardId: 'ranger', count: 1 },
    { cardId: 'strike', count: 2 },
    { cardId: 'unsummon', count: 1 },
    { cardId: 'seed', count: 1 },
    { cardId: 'energize', count: 1 },
  ];
};

export const useDeckStore = create<DeckStoreState>((set, get) => ({
  deck: createStarterDeckList(),

  addCard: (cardId: string) => {
    const { deck, canAddCard } = get();
    
    if (!canAddCard(cardId)) {
      return;
    }

    const existingEntry = deck.find(entry => entry.cardId === cardId);
    
    if (existingEntry) {
      set({
        deck: deck.map(entry =>
          entry.cardId === cardId
            ? { ...entry, count: entry.count + 1 }
            : entry
        ),
      });
    } else {
      set({
        deck: [...deck, { cardId, count: 1 }].sort((a, b) =>
          a.cardId.localeCompare(b.cardId)
        ),
      });
    }
  },

  removeCard: (cardId: string) => {
    const { deck } = get();
    const existingEntry = deck.find(entry => entry.cardId === cardId);
    
    if (!existingEntry) {
      return;
    }

    if (existingEntry.count === 1) {
      set({
        deck: deck.filter(entry => entry.cardId !== cardId),
      });
    } else {
      set({
        deck: deck.map(entry =>
          entry.cardId === cardId
            ? { ...entry, count: entry.count - 1 }
            : entry
        ),
      });
    }
  },

  setDeck: (deck: CardEntry[]) => {
    set({ deck: [...deck].sort((a, b) => a.cardId.localeCompare(b.cardId)) });
  },

  resetDeck: () => {
    set({ deck: createStarterDeckList() });
  },

  getCardCount: (cardId: string) => {
    const { deck } = get();
    const entry = deck.find(e => e.cardId === cardId);
    return entry ? entry.count : 0;
  },

  canAddCard: (cardId: string) => {
    const { deck, getDeckSize } = get();
    
    if (getDeckSize() >= MAX_DECK_SIZE) {
      return false;
    }
    
    const entry = deck.find(e => e.cardId === cardId);
    const currentCount = entry ? entry.count : 0;
    
    return currentCount < MAX_COPIES_PER_CARD;
  },

  getDeckSize: () => {
    const { deck } = get();
    return deck.reduce((sum, entry) => sum + entry.count, 0);
  },
}));

