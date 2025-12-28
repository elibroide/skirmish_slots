import React from 'react';
import type { GameEvent, PlayerId } from '@skirmish/engine';
import { useGameStore } from '../store/gameStore';

interface EventLogProps {
  events: GameEvent[];
}

/**
 * EventLog Component
 * Displays game events with perspective-aware labels
 */
export const EventLog: React.FC<EventLogProps> = ({ events }) => {
  const { localPlayerId, gameMode } = useGameStore();
  const isNetworkMode = gameMode === 'network';

  const getPlayerLabel = (playerId: PlayerId | undefined) => {
    if (playerId === undefined) return '';
    if (!isNetworkMode) return `P${playerId}`;
    return playerId === localPlayerId ? 'You' : 'Opp';
  };

  const getEventColor = (event: GameEvent) => {
    if ('playerId' in event) {
      const isLocalPlayer = event.playerId === localPlayerId;
      return isLocalPlayer ? 'bg-pink-50 border-pink-300' : 'bg-blue-50 border-blue-300';
    }
    return 'bg-white border-stone-400';
  };

  return (
    <div className="bg-stone-100 border-2 border-stone-800 rounded-lg p-4 h-full overflow-y-auto">
      <h2 className="font-hand text-xl mb-2 sticky top-0 bg-stone-100 z-10">Event Log</h2>
      <div className="space-y-2">
        {events.slice(-30).reverse().map((event, index) => {
          const playerLabel = 'playerId' in event ? getPlayerLabel(event.playerId as PlayerId) : '';
          
          return (
            <div key={index} className={`border rounded p-2 ${getEventColor(event)}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-stone-700">{event.type}</span>
                {playerLabel && (
                  <span className="text-[10px] font-mono bg-stone-200 px-1 rounded">
                    {playerLabel}
                  </span>
                )}
              </div>
              <pre className="text-[10px] font-mono text-stone-600 overflow-x-auto max-h-32 overflow-y-auto">
                {JSON.stringify(event, null, 2)}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
};
