import React, { useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { useGameStore } from './store/gameStore';

/**
 * Main App Component
 * Initializes game and renders the game board
 */
export default function App() {
  const { gameState, localPlayerId, initGame } = useGameStore();

  // Initialize game on mount
  useEffect(() => {
    initGame(0); // Start as player 0
  }, [initGame]);

  // Loading state
  if (!gameState) {
    return (
      <div className="min-h-screen bg-stone-200 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-hand text-6xl text-stone-800 mb-4">Skirmish</h1>
          <p className="font-ui text-xl text-stone-600">Loading game...</p>
        </div>
      </div>
    );
  }

  return <GameBoard gameState={gameState} localPlayerId={localPlayerId} />;
}
