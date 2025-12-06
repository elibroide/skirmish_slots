import React from 'react';
import type { UnitCard, PlayerId } from '../../engine/types';
import { Card } from './Card';

interface SlotProps {
  unit: UnitCard | null;
  slotModifier: number;
  playerId: PlayerId;
  terrainId: number;
  isPlayerSlot: boolean; // true = player's slot, false = opponent's slot
  isHighlighted?: boolean; // For targeting/deployment
  onDrop?: (terrainId: number) => void;
  winner?: PlayerId | null; // Who won this terrain
  isTargetable?: boolean; // For targeting mode - unit can be targeted
  onUnitClick?: (unitId: string) => void; // For clicking units (targeting)
}

/**
 * Slot Component
 * Represents one player's slot on a terrain
 * From mockup:
 * - Dashed border when empty and targetable (blue)
 * - Solid border when occupied (yellow/amber cards)
 * - Shows slot modifier as badge at bottom
 * - Shows crown icon if this player won the terrain
 */
export const Slot: React.FC<SlotProps> = ({
  unit,
  slotModifier,
  playerId,
  terrainId,
  isPlayerSlot,
  isHighlighted = false,
  onDrop,
  winner,
  isTargetable = false,
  onUnitClick,
}) => {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDrop && isPlayerSlot) {
      onDrop(terrainId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUnitClick = () => {
    if (isTargetable && unit && onUnitClick) {
      onUnitClick(unit.id);
    }
  };

  // Slot styling based on state
  const getSlotClasses = () => {
    const base = 'w-36 h-52 rounded-xl border-2 flex flex-col items-center justify-center relative';

    if (isTargetable && unit) {
      // Unit can be targeted - show as valid target
      return `${base} border-green-500 bg-green-50/50 border-solid shadow-lg cursor-pointer`;
    }

    if (isHighlighted && !unit) {
      // Valid target for deployment
      return `${base} border-blue-500 bg-blue-50/50 border-dashed`;
    }

    if (unit) {
      // Has a card - subtle background
      return `${base} border-stone-400 bg-stone-300/30`;
    }

    // Empty slot
    return `${base} border-stone-400 bg-stone-300/50 border-dashed`;
  };

  return (
    <div
      className={getSlotClasses()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleUnitClick}
    >
      {/* Card or empty state */}
      {unit ? (
        <div className="p-1">
          <Card card={unit} />
          {isTargetable && (
            <div className="absolute inset-0 border-4 border-green-400 rounded-xl pointer-events-none animate-pulse" />
          )}
        </div>
      ) : (
        <span className="font-ui text-xs text-stone-400">
          {isHighlighted ? 'Drop here' : 'Empty'}
        </span>
      )}

      {/* Slot Modifier Badge (bottom) */}
      {slotModifier !== 0 && (
        <div
          className={`
            absolute -bottom-2 left-1/2 -translate-x-1/2
            px-3 py-1 rounded-full text-xs font-bold
            ${slotModifier > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
            border border-stone-800 shadow-sm
          `}
        >
          {slotModifier > 0 ? '+' : ''}{slotModifier}
        </div>
      )}

      {/* Crown - Winner indicator */}
      {winner === playerId && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">
          👑
        </div>
      )}
    </div>
  );
};
