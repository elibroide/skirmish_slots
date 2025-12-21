import React, { useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { MainMenu, type OpponentType, type GameMode } from './components/MainMenu';
import { DeckBuilder } from './components/DeckBuilder';
import { WaitingRoom } from './components/WaitingRoom';
import { useGameStore } from './store/gameStore';
import { TestCardView } from '../components/debug/TestCardView';
import { DebugScene } from '../ui-new/DebugScene';

type Screen = 'menu' | 'deck-builder' | 'game' | 'waiting-room' | 'debug' | 'ui-debug';

/**
 * Main App Component
 * Handles screen navigation and game initialization
 */
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [lastGameMode, setLastGameMode] = useState<GameMode>('vs-ai');
  const [lastOpponentType, setLastOpponentType] = useState<OpponentType>('claude');
  const { gameState, engine, localPlayerId, initGame, initNetworkGame, networkGameCode, gameMode } = useGameStore();

  const handleStartGame = async (mode: GameMode, opponentType: OpponentType | string) => {
    setLastGameMode(mode);

    if (mode === 'network')
    {
      // Network multiplayer
      const isHost = opponentType === 'create';
      // Host is player 0, joiner is player 1
      await initNetworkGame(isHost ? 0 : 1, opponentType as string);

      if (isHost)
      {
        // Show waiting room for host
        setCurrentScreen('waiting-room');
      } else
      {
        // Joiner goes directly to game (will see waiting room until both ready)
        setCurrentScreen('waiting-room');
      }
    } else
    {
      // Local game
      const gameMode = mode === 'vs-ai' ? 'vs-ai' : mode === 'god-mode' ? 'god-mode' : 'human-vs-human';
      setLastOpponentType(opponentType as OpponentType);
      initGame(0, gameMode);
      setCurrentScreen('game');
    }
  };

  const handleCancelWaiting = () => {
    // TODO: Clean up network game
    setCurrentScreen('menu');
  };

  const handlePlayAgain = () => {
    handleStartGame(lastGameMode, lastOpponentType);
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
  };

  const handleOpenDeckBuilder = () => {
    setCurrentScreen('deck-builder');
  };

  const handleOpenDebug = () => {
    setCurrentScreen('debug');
  };

  const handleOpenUIDebug = () => {
    setCurrentScreen('ui-debug');
  };

  if (currentScreen === 'menu')
  {
    return (
      <MainMenu
        onStartGame={handleStartGame}
        onOpenDeckBuilder={handleOpenDeckBuilder}
        onOpenDebug={handleOpenDebug}
        onOpenUIDebug={handleOpenUIDebug}
      />
    );
  }

  if (currentScreen === 'ui-debug')
  {
    return <DebugScene onBack={handleBackToMenu} />;
  }

  if (currentScreen === 'debug')
  {
    return (
      <div className="relative">
        <button
          onClick={handleBackToMenu}
          className="fixed top-4 right-4 z-50 bg-stone-800 text-white px-4 py-2 rounded shadow"
        >
          Back to Menu
        </button>
        <TestCardView />
      </div>
    );
  }

  if (currentScreen === 'deck-builder')
  {
    return <DeckBuilder onBack={handleBackToMenu} />;
  }

  if (currentScreen === 'waiting-room')
  {
    // Auto-transition to game when opponent joins
    if (gameMode === 'network' && gameState && engine)
    {
      setCurrentScreen('game');
    }

    return <WaitingRoom gameCode={networkGameCode || ''} onCancel={handleCancelWaiting} />;
  }

  if (!gameState || !engine)
  {
    return (
      <div className="min-h-screen bg-stone-200 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-hand text-6xl text-stone-800 mb-4">Skirmish</h1>
          <p className="font-ui text-xl text-stone-600">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <GameBoard
      gameState={gameState}
      engine={engine}
      localPlayerId={localPlayerId}
      onPlayAgain={handlePlayAgain}
      onMainMenu={handleBackToMenu}
    />
  );
}
