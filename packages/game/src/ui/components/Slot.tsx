import React from 'react';
import type { UnitCard, PlayerId } from '../../engine/types';

interface SlotProps {
  unit: UnitCard | null;
  slotModifier: number;
  playerId: PlayerId;
  terrainId: number;
  isPlayerSlot: boolean; // true = player's slot, false = opponent's slot
  isHighlighted?: boolean; // For targeting/deployment
  onDrop?: (terrainId: number, slotPlayerId: PlayerId) => void;
  winner?: PlayerId | null; // Who won this terrain
  isTargetable?: boolean; // For targeting mode - unit can be targeted
  onUnitClick?: (unitId: string) => void; // For clicking units (targeting)
  onSlotClick?: (terrainId: number, playerId: PlayerId) => void; // For clicking slots (targeting)
  slotId?: number; // Numeric ID for tracking
}

/**
 * Slot Component
 * 
 * DESIGN UPDATE:
 * - Visuals (dotted lines, glows, unit art) are now handled by Phaser (BoardScene.ts).
 * - This React component acts as a transparent interaction layer (Drop Target / Click Target).
 * - We still render badges (Modifier, Crown) here overlaying the Phaser slot.
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
  onSlotClick,
  slotId,
}) => {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDrop && (isPlayerSlot || isHighlighted || isTargetable))
    {
      onDrop(terrainId, playerId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleClick = () => {
    if (isTargetable)
    {
      if (onSlotClick)
      {
        onSlotClick(terrainId, playerId);
        return;
      }
      if (unit && onUnitClick)
      {
        onUnitClick(unit.id);
      }
    }
  };

  return (
    <div
      className="w-full h-full relative cursor-pointer group"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
    >
      {/* 
        DEBUG/HOVER HINT: 
        Uncomment bg-red-500/20 to see the interactable area 
      */}
      {/* <div className="absolute inset-0 bg-red-500/20 pointer-events-none" /> */}

      {/* 
        Targeting Indicator:
        If targetable, we still might want a React overlay cursor/border or rely on Phaser?
        Phaser handles visuals, but "Targetable" pointer interactions might need visual feedback here?
        For now, let's keep a subtle pulse if targetable to ensure usability.
      */}
      {isTargetable && (
        <div className="absolute inset-0 border-4 border-green-400/50 rounded-xl pointer-events-none animate-pulse" />
      )}

      {/* Slot Modifier Badge */}
      {slotModifier !== 0 && (
        <div
          className={`
            absolute left-1/2 -translate-x-1/2
            ${isPlayerSlot ? '-bottom-2' : '-top-2'}
            px-3 py-1 rounded-full text-xs font-bold
            ${slotModifier > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
            border border-stone-800 shadow-sm z-10
          `}
        >
          {slotModifier > 0 ? '+' : ''}{slotModifier}
        </div>
      )}

      {/* Crown - Winner indicator */}
      {winner === playerId && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl z-10 drop-shadow-md">
          👑
        </div>
      )}
    </div>
  );
};
