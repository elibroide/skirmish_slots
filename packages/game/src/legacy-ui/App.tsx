import React, { useState } from 'react';
import { GameScene } from '../ui/GameScene';
import { MainMenu, type OpponentType, type GameMode } from './components/MainMenu';
import { DeckBuilder } from './components/DeckBuilder';
import { WaitingRoom } from './components/WaitingRoom';
import { useGameStore } from '../store/gameStore';
import { TestCardView } from '../components/debug/TestCardView';
import { DebugScene } from '../ui/DebugScene';
import { CardFrameView } from './components/CardFrameView';

type Screen = 'menu' | 'deck-builder' | 'game' | 'waiting-room' | 'debug' | 'ui-debug' | 'card-frame-view';

/**
 * Main App Component
 * Handles screen navigation and game initialization
 */
import { createGame } from '@skirmish/engine';
import type { GameEngine } from '@skirmish/engine';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [lastGameMode, setLastGameMode] = useState<GameMode>('god-mode');
  const [lastOpponentType, setLastOpponentType] = useState<OpponentType>('rookie');

  const [startGameCallback, setStartGameCallback] = useState<(() => Promise<void>) | null>(null);

  // App manages the Engine instance
  const [engine, setEngine] = useState<GameEngine | null>(null);

  const { gameState, localPlayerId, setInitialGameState, gameMode } = useGameStore();

  const handleStartGame = async (mode: GameMode, opponentType: OpponentType | string) => {
    setLastGameMode(mode);

    if (mode === 'network')
    {
      // Network multiplayer
      const isHost = opponentType === 'create';
      // Host is player 0, joiner is player 1
      await Promise.reject("Network Game Temporarily Disabled for Refactor");

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

      const { engine: newEngine, localPlayerId: pid, gameMode: modeStr, start } = await createGame(0, gameMode, { autoStart: false });
      setEngine(newEngine);

      // Store start function to pass to GameScene
      setStartGameCallback(() => start);

      // DEFERRED INIT:
      // We set metadata in store, but we DO NOT set the full game state yet
      // because the engine is not initialized.
      // SkirmishStartedHandler will handle the full state hydration.

      // Set local player ID in store for other components
      useGameStore.setState({ localPlayerId: pid, gameMode: modeStr });

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

  const handleOpenCardFrameView = () => {
    setCurrentScreen('card-frame-view');
  };

  if (currentScreen === 'menu')
  {
    return (
      <MainMenu
        onStartGame={handleStartGame}
        onOpenDeckBuilder={handleOpenDeckBuilder}
        onOpenDebug={handleOpenDebug}
        onOpenUIDebug={handleOpenUIDebug}
        onOpenCardFrameView={handleOpenCardFrameView}
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

    return <WaitingRoom gameCode={''} onCancel={handleCancelWaiting} />;
  }

  if (currentScreen === 'card-frame-view')
  {
    return <CardFrameView onBack={handleBackToMenu} />;
  }

  if (currentScreen === 'game')
  {
    // Render GameScene if engine is ready (ignore gameState check)
    if (engine)
    {
      return (
        <GameScene
          engine={engine}
          localPlayerId={0} // Force 0 as per createGame
          onBack={handleBackToMenu}
          onReady={startGameCallback ? startGameCallback : undefined}
        />
      );
    }
  }

  if (!engine && currentScreen === 'game') // Only show loading if supposed to be in game
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

  // Fallback for menu/other screens handled above in their blocks
  return null;
}

