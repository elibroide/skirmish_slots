import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Hand } from './Hand';
import { Slot } from './Slot';
import { InfoPanel } from './InfoPanel';
import type { SlotId } from '../../engine/types';

export function GameBoard() {
  const {
    gameState,
    selectedCardId,
    isProcessing,
    playCard,
    pass,
    selectCard,
    initGame,
  } = useGameStore();

  // Initialize game on mount
  useEffect(() => {
    if (!gameState) {
      initGame();
    }
  }, [gameState, initGame]);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-400">Loading game...</div>
      </div>
    );
  }

  const currentPlayer = gameState.currentPlayer;
  const player0 = gameState.players[0];
  const player1 = gameState.players[1];

  // Check if current player is selecting a unit card
  const selectedCard = selectedCardId
    ? player0.hand.find((c) => c.id === selectedCardId) ||
      player1.hand.find((c) => c.id === selectedCardId)
    : null;

  const isUnitCard = selectedCard && 'power' in selectedCard;
  const canPlayToSlots = isUnitCard && currentPlayer === 0; // For now, only player 0 is human

  const handleSlotClick = (slotId: SlotId) => {
    if (canPlayToSlots && selectedCardId) {
      playCard(selectedCardId, slotId);
    }
  };

  const handleCardClick = (cardId: string) => {
    if (selectedCardId === cardId) {
      // Deselect
      selectCard(null);
    } else {
      selectCard(cardId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Skirmish
          </h1>
          <p className="text-gray-400 mt-2">Strategic Territory Control</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-center">
          {/* Left Side - Player 1 Info */}
          <div className="flex flex-col gap-4">
            <div className="card p-4">
              <div className="text-xl font-bold text-player2 mb-2">Player 1 (AI)</div>
              <div className="text-sm text-gray-400">
                Hand: {player1.hand.length} cards
              </div>
              <div className="text-sm text-gray-400">
                Deck: {player1.deck.length} cards
              </div>
              {gameState.hasPassed[1] && (
                <div className="text-yellow-400 font-bold mt-2">PASSED</div>
              )}
            </div>
          </div>

          {/* Center - Game Board */}
          <div className="flex flex-col gap-8">
            {/* Player 1 Hand (hidden for now) */}
            <div className="h-20 bg-gray-800/30 rounded-lg flex items-center justify-center text-gray-500 text-sm">
              Player 1 Hand ({player1.hand.length} cards)
            </div>

            {/* Battlefield - 4 Slots */}
            <div className="flex gap-4 justify-center">
              {gameState.slots.map((slot, idx) => (
                <Slot
                  key={idx}
                  slot={slot}
                  slotId={idx as SlotId}
                  onSlotClick={handleSlotClick}
                  canPlay={canPlayToSlots}
                  highlighted={canPlayToSlots && !isProcessing}
                />
              ))}
            </div>

            {/* Player 0 Hand */}
            <Hand
              cards={player0.hand}
              selectedCardId={selectedCardId}
              onCardClick={handleCardClick}
              disabled={currentPlayer !== 0 || isProcessing || gameState.hasPassed[0]}
            />

            {/* Instructions */}
            {currentPlayer === 0 && !gameState.hasPassed[0] && (
              <div className="text-center text-sm text-gray-400">
                {selectedCardId
                  ? isUnitCard
                    ? 'Click a slot to play this unit'
                    : 'Action cards coming soon'
                  : 'Select a card from your hand'}
              </div>
            )}
          </div>

          {/* Right Side - Info Panel */}
          <div>
            <InfoPanel
              currentPlayer={currentPlayer}
              player0VP={player0.vp}
              player1VP={player1.vp}
              player0RoundsWon={player0.roundsWon}
              player1RoundsWon={player1.roundsWon}
              currentRound={gameState.currentRound}
              hasPassed={gameState.hasPassed}
              onPass={pass}
              matchWinner={gameState.matchWinner}
            />

            {/* Player 0 Info */}
            <div className="card p-4 mt-4">
              <div className="text-xl font-bold text-player1 mb-2">Player 0 (You)</div>
              <div className="text-sm text-gray-400">
                Hand: {player0.hand.length} cards
              </div>
              <div className="text-sm text-gray-400">
                Deck: {player0.deck.length} cards
              </div>
              {gameState.hasPassed[0] && (
                <div className="text-yellow-400 font-bold mt-2">PASSED</div>
              )}
            </div>
          </div>
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="text-2xl text-white">Processing...</div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
