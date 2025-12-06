import React from 'react';
import type { GameEvent } from '../../engine/types';

interface EventLogProps {
  events: GameEvent[];
}

/**
 * EventLog Component
 * Displays game events as JSON for debugging
 */
export const EventLog: React.FC<EventLogProps> = ({ events }) => {
  return (
    <div className="bg-stone-100 border-2 border-stone-800 rounded-lg p-4 h-full overflow-y-auto">
      <h2 className="font-hand text-xl mb-2 sticky top-0 bg-stone-100">Event Log</h2>
      <div className="space-y-2">
        {events.slice(-20).reverse().map((event, index) => (
          <div key={index} className="bg-white border border-stone-400 rounded p-2">
            <div className="font-bold text-xs text-stone-700 mb-1">{event.type}</div>
            <pre className="text-[10px] font-mono text-stone-600 overflow-x-auto">
              {JSON.stringify(event, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
