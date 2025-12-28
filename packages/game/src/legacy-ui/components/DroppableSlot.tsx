import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Slot } from './Slot';
import type { TerrainId, PlayerId, UnitCard } from '@skirmish/engine';

interface DroppableSlotProps {
  terrainId: TerrainId;
  playerId: PlayerId;
  unit: UnitCard | null;
  slotModifier: number;
  isPlayerSlot: boolean;
  isHighlighted?: boolean;
  winner?: PlayerId | null;
  isTargetable?: boolean;
  onUnitClick?: (unitId: string) => void;
  onSlotClick?: (terrainId: number, playerId: PlayerId) => void;
  slotId?: number; // Numeric ID for tracking (0-9)
}

export const DroppableSlot: React.FC<DroppableSlotProps> = ({
  terrainId,
  playerId,
  unit,
  slotModifier,
  isPlayerSlot,
  isHighlighted,
  winner,
  isTargetable,
  onUnitClick,
  onSlotClick,
  slotId,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${terrainId}-${playerId}`,
    data: {
      slotCoord: { terrainId, playerId },
      slotId, // Pass for drag over tracking
    },
  });

  return (
    <div ref={setNodeRef} className="w-full h-full">
      <Slot
        terrainId={terrainId}
        playerId={playerId}
        unit={unit}
        slotModifier={slotModifier}
        isPlayerSlot={isPlayerSlot}
        isHighlighted={isHighlighted || isOver}
        winner={winner}
        isTargetable={isTargetable}
        onUnitClick={onUnitClick}
        onSlotClick={onSlotClick}
        slotId={slotId}
      />
    </div>
  );
};
