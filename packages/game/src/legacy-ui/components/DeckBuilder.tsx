import React, { useMemo } from 'react';
import { useDeckStore, ALL_CARD_IDS } from '../store/deckStore';
import { Card } from './Card';
import { createCard } from '@skirmish/engine';
import { GameEngine } from '@skirmish/engine';
import type { Card as CardType } from '@skirmish/engine';

export type DeckBuilderProps = {
  onBack: () => void;
};

/**
 * Create a mock engine for card display purposes only
 * We don't need a full game engine, just enough to instantiate cards
 */
const createMockEngine = (): any => {
  return {
    getCardById: () => null,
    state: { 
      players: [{ id: 0 }, { id: 1 }],
      terrains: [],
    },
    emitEvent: () => {},
    registerOngoingEffect: () => {},
    unregisterOngoingEffect: () => {},
    isDeploymentAllowed: () => false,
    ruleManager: {
      registerRule: () => {},
      unregisterRule: () => {},
    },
    onEvent: () => () => {},
  };
};

/**
 * DeckBuilder Component
 * 
 * Visual card-based deck building:
 * - Shows actual card visuals
 * - Click card in deck to remove one copy
 * - Click card in collection to add one copy
 * - 3 copy limit per card (grays out when at max)
 * - Alphabetical ordering
 */
export const DeckBuilder: React.FC<DeckBuilderProps> = ({ onBack }) => {
  const { deck, addCard, removeCard, resetDeck, getCardCount, canAddCard, getDeckSize } = useDeckStore();

  const MIN_DECK_SIZE = 20;
  const MAX_DECK_SIZE = 30;
  const deckSize = getDeckSize();
  const isValidDeck = deckSize >= MIN_DECK_SIZE && deckSize <= MAX_DECK_SIZE;

  const mockEngine = useMemo(() => createMockEngine(), []);

  const allCardsWithInstances = useMemo(() => {
    return ALL_CARD_IDS.map(cardId => ({
      cardId,
      card: createCard(cardId, 0, mockEngine),
    }));
  }, [mockEngine]);

  const deckCardsExpanded = useMemo(() => {
    const expanded: Array<{ cardId: string; card: CardType; copyIndex: number }> = [];
    deck.forEach(entry => {
      const card = createCard(entry.cardId, 0, mockEngine);
      for (let i = 0; i < entry.count; i++) {
        expanded.push({ cardId: entry.cardId, card, copyIndex: i });
      }
    });
    return expanded;
  }, [deck, mockEngine]);

  return (
    <div className="min-h-screen bg-stone-200 p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="font-hand text-6xl text-stone-800">Deck Builder</h1>
            <p className="font-ui text-stone-600 mt-2">
              Deck Size: <span className={`font-semibold ${isValidDeck ? 'text-green-600' : 'text-red-600'}`}>
                {deckSize}
              </span> / {MAX_DECK_SIZE} (min: {MIN_DECK_SIZE})
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={resetDeck}
              className="px-6 py-3 bg-stone-600 hover:bg-stone-700 text-white font-ui font-semibold rounded-lg transition-colors"
            >
              Reset to Starter
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-ui font-semibold rounded-lg transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="font-hand text-3xl text-stone-800 mb-4">Your Deck</h2>
            <p className="font-ui text-sm text-stone-600 mb-4">Click a card to remove one copy</p>
            
            <div className="grid grid-cols-4 gap-4 max-h-[700px] overflow-y-auto p-2">
              {deckCardsExpanded.length === 0 ? (
                <div className="col-span-4 text-center py-12">
                  <p className="font-ui text-stone-500 italic">Empty deck</p>
                </div>
              ) : (
                deckCardsExpanded.map((item, index) => {
                  const count = getCardCount(item.cardId);
                  return (
                    <div
                      key={`${item.cardId}-${index}`}
                      onClick={() => removeCard(item.cardId)}
                      className="relative cursor-pointer hover:scale-105 transition-transform"
                    >
                      <Card card={item.card} isInHand={false} />
                      {count > 1 && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-stone-800 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="font-ui text-white font-bold text-sm">×{count}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="font-hand text-3xl text-stone-800 mb-4">Card Collection</h2>
            <p className="font-ui text-sm text-stone-600 mb-4">Click a card to add one copy (max 3)</p>
            
            <div className="grid grid-cols-4 gap-4 max-h-[700px] overflow-y-auto p-2">
              {allCardsWithInstances.map(({ cardId, card }) => {
                const count = getCardCount(cardId);
                const canAdd = canAddCard(cardId);
                
                return (
                  <div
                    key={cardId}
                    onClick={() => canAdd && addCard(cardId)}
                    className={`relative transition-all ${
                      canAdd
                        ? 'cursor-pointer hover:scale-105'
                        : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <Card card={card} isInHand={false} />
                    {count > 0 && (
                      <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center ${
                        canAdd ? 'bg-blue-600' : 'bg-stone-500'
                      }`}>
                        <span className="font-ui text-white font-bold text-sm">{count}/3</span>
                      </div>
                    )}
                    {!canAdd && count === 3 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <span className="font-hand text-2xl text-white">MAX</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

