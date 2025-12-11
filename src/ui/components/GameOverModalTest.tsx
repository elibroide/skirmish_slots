import React from 'react';
import { GameOverModal } from './GameOverModal';
import type { GameState } from '../../engine/types';

/**
 * Test component to visualize the Game Over Modal
 * 
 * To use this, temporarily import it in App.tsx and render it
 * or open the browser console and call window.triggerGameOver(0) or window.triggerGameOver(1)
 */
export const GameOverModalTest: React.FC = () => {
  const [scenario, setScenario] = React.useState<'victory' | 'defeat' | 'draw' | null>(null);

  const createMockGameState = (matchWinner: 0 | 1 | null, localWins: number, opponentWins: number): GameState => {
    return {
      players: [
        {
          id: 0,
          deck: [],
          hand: [],
          graveyard: [],
          skirmishesWon: localWins,
        } as any,
        {
          id: 1,
          deck: [],
          hand: [],
          graveyard: [],
          skirmishesWon: opponentWins,
        } as any,
      ],
      terrains: [],
      currentSkirmish: 3,
      currentPlayer: 0,
      isDone: [false, false],
      tieSkirmishes: 0,
      matchWinner: matchWinner as any,
    } as any;
  };

  if (scenario === null) {
    return (
      <div className="min-h-screen bg-stone-200 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-4">
          <h1 className="font-hand text-4xl text-stone-800 mb-4">Game Over Modal Test</h1>
          
          <button
            onClick={() => setScenario('victory')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-hand text-xl py-3 rounded-lg"
          >
            Test Victory (2-0)
          </button>
          
          <button
            onClick={() => setScenario('defeat')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-hand text-xl py-3 rounded-lg"
          >
            Test Defeat (0-2)
          </button>
          
          <button
            onClick={() => setScenario('draw')}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-hand text-xl py-3 rounded-lg"
          >
            Test Draw (2-2)
          </button>
        </div>
      </div>
    );
  }

  const scenarios = {
    victory: createMockGameState(0, 2, 0),
    defeat: createMockGameState(1, 0, 2),
    draw: createMockGameState(null, 2, 2),
  };

  return (
    <div className="min-h-screen bg-stone-200 flex items-center justify-center">
      <GameOverModal
        gameState={scenarios[scenario]}
        localPlayerId={0}
        onPlayAgain={() => {
          console.log('Play Again clicked');
          setScenario(null);
        }}
        onMainMenu={() => {
          console.log('Main Menu clicked');
          setScenario(null);
        }}
      />
      
      <div className="text-center">
        <h2 className="font-hand text-4xl text-stone-800">Game Board Behind Modal</h2>
        <p className="font-ui text-stone-600 mt-2">The modal should overlay this content</p>
      </div>
    </div>
  );
};

