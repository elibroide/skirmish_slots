import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export type WaitingRoomProps = {
  gameCode: string;
  onCancel: () => void;
};

/**
 * WaitingRoom Component
 * 
 * Displays while waiting for opponent to join.
 * Shows the 6-digit game code for sharing.
 */
export const WaitingRoom: React.FC<WaitingRoomProps> = ({ gameCode, onCancel }) => {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'waiting' | 'connected' | 'starting'>('waiting');
  const { networkGameId, networkSync } = useGameStore();

  useEffect(() => {
    if (!networkGameId || !networkSync) return;

    // Subscribe to game ready state
    const firebase = networkSync.getFirebase();
    const unsubscribe = firebase.subscribeToReadyState(networkGameId, (gameData) => {
      if (gameData.gameStarted) {
        setStatus('starting');
      } else if (gameData.player0Ready && gameData.player1Ready) {
        setStatus('connected');
      } else {
        setStatus('waiting');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [networkGameId, networkSync]);

  const handleCopy = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'connected':
        return 'Opponent connected! Starting game...';
      case 'starting':
        return 'Loading game...';
      default:
        return 'Waiting for player to join...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
      case 'starting':
        return 'text-green-600';
      default:
        return 'text-stone-600';
    }
  };

  return (
    <div className="min-h-screen bg-stone-200 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="font-hand text-6xl text-stone-800 mb-2">
              {status === 'waiting' ? 'Waiting for Opponent' : 'Game Starting!'}
            </h1>
            <p className="font-ui text-lg text-stone-600">Share this code with your friend</p>
          </div>

          <div className="bg-stone-100 rounded-lg p-8 mb-6">
            <div className="text-center">
              <p className="font-ui text-sm text-stone-600 mb-2">Game Code</p>
              <div className="font-mono text-7xl font-bold text-blue-600 tracking-widest mb-4 select-all">
                {gameCode}
              </div>
              <button
                onClick={handleCopy}
                className="bg-blue-600 hover:bg-blue-700 text-white font-ui px-6 py-3 rounded-lg transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className={`inline-flex items-center gap-2 ${getStatusColor()}`}>
              {status === 'waiting' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              ) : (
                <div className="h-5 w-5 rounded-full bg-green-600 animate-pulse"></div>
              )}
              <span className="font-ui font-semibold">{getStatusMessage()}</span>
            </div>
          </div>

          {status === 'waiting' && (
            <div className="text-center">
              <button
                onClick={onCancel}
                className="bg-stone-300 hover:bg-stone-400 text-stone-700 font-ui px-6 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-stone-500 font-ui">
            <p>Your friend can join by entering this code in the main menu</p>
          </div>
        </div>
      </div>
    </div>
  );
};

