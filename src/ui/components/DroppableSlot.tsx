import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Slot } from './Slot';
import type { TerrainId, PlayerId, UnitCard } from '../../engine/types';

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
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${terrainId}-${playerId}`,
    data: {
      slotCoord: { terrainId, playerId },
    },
  });

  return (
    <div ref={setNodeRef}>
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
      />
    </div>
  );
};

