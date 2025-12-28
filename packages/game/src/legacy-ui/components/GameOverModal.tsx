import React from 'react';
import type { PlayerId, GameState } from '@skirmish/engine';

export type GameOverModalProps = {
  gameState: GameState;
  localPlayerId: PlayerId;
  onPlayAgain: () => void;
  onMainMenu: () => void;
};

/**
 * GameOverModal Component
 * 
 * Displays when the match ends with:
 * - Winner/Loser message
 * - Final score
 * - Replay button
 * - Main Menu button
 */
export const GameOverModal: React.FC<GameOverModalProps> = ({
  gameState,
  localPlayerId,
  onPlayAgain,
  onMainMenu,
}) => {
  const { matchWinner, players } = gameState;
  
  if (matchWinner === undefined) return null;

  const opponentId = localPlayerId === 0 ? 1 : 0;
  const localPlayer = players[localPlayerId];
  const opponentPlayer = players[opponentId];

  const isLocalPlayerWinner = matchWinner === localPlayerId;
  const isDraw = matchWinner === null;

  const localScore = localPlayer.skirmishesWon;
  const opponentScore = opponentPlayer.skirmishesWon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center space-y-6">
          {isDraw ? (
            <>
              <div className="text-6xl font-hand text-amber-600">Draw!</div>
              <p className="font-ui text-xl text-stone-700">
                The match ended in a tie
              </p>
            </>
          ) : isLocalPlayerWinner ? (
            <>
              <div className="text-6xl font-hand text-green-600">Victory!</div>
              <p className="font-ui text-xl text-stone-700">
                You won the match!
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl font-hand text-red-600">Defeat</div>
              <p className="font-ui text-xl text-stone-700">
                Your opponent won the match
              </p>
            </>
          )}

          <div className="bg-stone-100 rounded-lg p-6 space-y-3">
            <h3 className="font-hand text-2xl text-stone-800">Final Score</h3>
            
            <div className="space-y-2">
              <div className={`flex justify-between items-center px-4 py-3 rounded ${
                isLocalPlayerWinner && !isDraw ? 'bg-green-100 border-2 border-green-500' : 'bg-white'
              }`}>
                <span className="font-ui font-semibold text-stone-800">You</span>
                <span className="font-hand text-3xl text-stone-800">{localScore}</span>
              </div>
              
              <div className={`flex justify-between items-center px-4 py-3 rounded ${
                !isLocalPlayerWinner && !isDraw ? 'bg-red-100 border-2 border-red-500' : 'bg-white'
              }`}>
                <span className="font-ui font-semibold text-stone-800">Opponent</span>
                <span className="font-hand text-3xl text-stone-800">{opponentScore}</span>
              </div>
            </div>

            <p className="font-ui text-sm text-stone-600 pt-2">
              Skirmishes Won
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={onPlayAgain}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-hand text-2xl py-4 rounded-lg transition-colors shadow-md"
            >
              Play Again
            </button>
            
            <button
              onClick={onMainMenu}
              className="w-full bg-stone-600 hover:bg-stone-700 text-white font-hand text-2xl py-4 rounded-lg transition-colors shadow-md"
            >
              Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

