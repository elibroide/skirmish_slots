import React, { useState } from 'react';
import { FullScreenToggle } from './FullScreenToggle';

export type OpponentType = 'heuristic' | 'claude' | 'human';
export type GameMode = 'vs-ai' | 'human-vs-human' | 'god-mode' | 'network';

export type MainMenuProps = {
  onStartGame: (mode: GameMode, opponentType: OpponentType | string) => void;
  onOpenDeckBuilder: () => void;
  onOpenDebug?: () => void;
  onOpenUIDebug?: () => void;
  onOpenCardFrameView?: () => void;
};

/**
 * MainMenu Component
 * 
 * Displays the main menu with options to:
 * - Start a single player game (with opponent selection: AI or Human for testing)
 * - Open the deck builder
 */
export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onOpenDeckBuilder, onOpenDebug, onOpenUIDebug, onOpenCardFrameView }) => {
  const [selectedOpponent, setSelectedOpponent] = useState<OpponentType>('claude');
  const [gameIdInput, setGameIdInput] = useState('');
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  const handleStartGame = () => {
    const mode: GameMode = selectedOpponent === 'human' ? 'god-mode' : 'vs-ai';
    onStartGame(mode, selectedOpponent);
  };

  const handleCreateNetworkGame = async () => {
    setIsCreatingGame(true);
    try
    {
      await onStartGame('network', 'create');
    } finally
    {
      setIsCreatingGame(false);
    }
  };

  const handleJoinGame = () => {
    if (!gameIdInput.trim())
    {
      alert('Please enter a Game ID');
      return;
    }
    onStartGame('network', gameIdInput.trim());
  };

  return (
    <div className="min-h-screen bg-stone-200 flex items-center justify-center p-8 relative">
      <FullScreenToggle className="absolute top-4 right-4" />
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="font-hand text-8xl text-stone-800 mb-4">Skirmish</h1>
          <p className="font-ui text-xl text-stone-600">A tactical card game</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="font-hand text-3xl text-stone-800 mb-4">Single Player</h2>

            <div className="bg-stone-100 rounded-lg p-4 space-y-3">
              <label className="font-ui text-stone-700 font-semibold">Opponent:</label>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedOpponent('heuristic')}
                  className={`px-4 py-2 rounded-lg font-ui font-semibold transition-colors ${selectedOpponent === 'heuristic'
                    ? 'bg-stone-700 text-white'
                    : 'bg-white text-stone-700 hover:bg-stone-200'
                    }`}
                >
                  Heuristic AI
                </button>

                <button
                  onClick={() => setSelectedOpponent('claude')}
                  className={`px-4 py-2 rounded-lg font-ui font-semibold transition-colors ${selectedOpponent === 'claude'
                    ? 'bg-stone-700 text-white'
                    : 'bg-white text-stone-700 hover:bg-stone-200'
                    }`}
                >
                  Claude AI
                </button>

                <button
                  onClick={() => setSelectedOpponent('human')}
                  className={`px-4 py-2 rounded-lg font-ui font-semibold transition-colors ${selectedOpponent === 'human'
                    ? 'bg-stone-700 text-white'
                    : 'bg-white text-stone-700 hover:bg-stone-200'
                    }`}
                >
                  Human
                </button>
              </div>

              <div className="text-sm text-stone-600 font-ui mt-2">
                {selectedOpponent === 'heuristic' && (
                  <p>Fast, rule-based AI that makes strategic decisions based on card values and board state.</p>
                )}
                {selectedOpponent === 'claude' && (
                  <p>Slower but more intelligent AI powered by Claude that considers complex strategies.</p>
                )}
                {selectedOpponent === 'human' && (
                  <p>Hot seat mode for testing - both players control their own turns on the same device.</p>
                )}
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-hand text-2xl py-4 rounded-lg transition-colors shadow-md"
            >
              Start Single Player Game
            </button>
          </div>

          <div className="border-t border-stone-300 pt-6">
            <h2 className="font-hand text-3xl text-stone-800 mb-4">Network Multiplayer</h2>

            <div className="space-y-3">
              <button
                onClick={handleCreateNetworkGame}
                disabled={isCreatingGame}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-hand text-2xl py-4 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingGame ? 'Creating Game...' : 'Host Network Game'}
              </button>

              <div className="bg-stone-100 rounded-lg p-4">
                <label className="font-ui text-stone-700 font-semibold block mb-2">
                  Join a Game:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 6-digit code..."
                    value={gameIdInput}
                    onChange={(e) => setGameIdInput(e.target.value.toUpperCase().slice(0, 6))}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
                    maxLength={6}
                    className="flex-1 px-4 py-3 rounded-lg border-2 border-stone-300 font-mono text-2xl text-center tracking-widest focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleJoinGame}
                    disabled={gameIdInput.trim().length !== 6}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-hand text-xl px-6 py-3 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Join
                  </button>
                </div>
                <p className="text-sm text-stone-600 font-ui mt-2">
                  Enter the 6-digit code your friend shared with you.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-300 pt-6">
            <h2 className="font-hand text-3xl text-stone-800 mb-4">Deck Builder</h2>
            <button
              onClick={onOpenDeckBuilder}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-hand text-2xl py-4 rounded-lg transition-colors shadow-md"
            >
              Build Your Deck
            </button>
          </div>

          <div className="border-t border-stone-300 pt-6">
            <h2 className="font-hand text-3xl text-stone-800 mb-4">Development</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={onOpenDebug}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-hand text-2xl py-4 rounded-lg transition-colors shadow-md"
              >
                Card Debugger
              </button>
              <button
                onClick={onOpenUIDebug}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-hand text-2xl py-4 rounded-lg transition-colors shadow-md"
              >
                UI Playground
              </button>
              <button
                onClick={onOpenCardFrameView}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-hand text-2xl py-4 rounded-lg transition-colors shadow-md"
              >
                Card Frame
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-stone-600 font-ui text-sm">
          <p>Best of 3 skirmishes • 5 terrains • Win by controlling the majority</p>
        </div>
      </div>
    </div>
  );
};

