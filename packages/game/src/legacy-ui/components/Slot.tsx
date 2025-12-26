import React from 'react';
import type { UnitCard, PlayerId } from '../../engine/types';
import { useGameStore } from '../../store/gameStore';
import { PowerCircle } from './PowerCircle';
import cardData from '../../ui/Data/order.json';

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
  slotId?: number; // Numeric ID for listening to store
}

/**
 * Slot Component
 * 
 * DESIGN UPDATE:
 * - Migrated visuals back to React from Phaser.
 * - Renders Background, Stroke, Unit, and Power Circle.
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

  // Connect to Store for Visual State (Status, Power)
  // We use store lookup if slotId is provided.
  const slotData = useGameStore((state) => (slotId !== undefined ? state.slots[slotId] : null));

  const status = slotData?.status || 'idle';
  const power = slotData?.power || 0;
  const powerState = slotData?.powerState || 'none';

  // --- Logic for Background/Stroke ---
  // Replicating BoardScene.ts logic
  // idle: stroke 2px white 0.4 opacity
  // showTarget (Target): yellow fill 0.2, stroke 4px yellow
  // showDrop (Active/Valid): blue highlight? 
  //   Actually BoardScene had: isTarget ? Yellow : Blue

  const isTarget = status === 'showTarget';
  const isActive = status === 'showDrop'; // "Drop" state

  let borderColor = 'rgba(255,255,255,0.4)';
  let borderWidth = '2px';
  let bgColor = 'transparent';

  if (isTarget)
  {
    borderColor = '#facc15'; // Yellow-400
    borderWidth = '4px';
    bgColor = 'rgba(250, 204, 21, 0.2)';
  } else if (isActive)
  {
    borderColor = '#60a5fa'; // Blue-400
    borderWidth = '3px';
    bgColor = 'rgba(96, 165, 250, 0.1)';
  } else if (isHighlighted)
  {
    // Keep internal prop highlight as fallback
    borderColor = '#60a5fa';
    borderWidth = '3px';
    bgColor = 'rgba(96, 165, 250, 0.1)';
  } else if (isTargetable)
  {
    borderColor = '#4ade80'; // Green
    borderWidth = '3px';
  }

  // --- Unit Art Lookup ---
  let unitImageSrc: string | undefined;
  if (unit)
  {
    // Find definition relative to cardData
    // This is a bit hacky, depending on how data is structured. 
    // Assuming cardData has cards array.
    const cardDef = (cardData as any).cards.find((c: any) => c.id === unit.cardId);
    if (cardDef)
    {
      // Construct path: /tiles/FileName.board.png
      // We need to know the asset name. 
      // BoardScene used: cardDef.data.name + '.board.png'
      // We can try to replicate that. Or use a cleaner mapping.
      // NOTE: React needs correct public path. assuming root.
      unitImageSrc = `/tiles/${cardDef.data.name}.board.png`;
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDrop && (isPlayerSlot || isHighlighted || isTargetable || isActive))
    {
      onDrop(terrainId, playerId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleClick = () => {
    if (isTargetable || isActive || isTarget)
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
      className="w-full h-full relative cursor-pointer group transition-colors duration-200"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
      style={{
        border: `${borderWidth} solid ${borderColor}`,
        backgroundColor: bgColor,
        borderRadius: '12px',
        boxSizing: 'border-box',
      }}
    >
      {/* Unit Image */}
      {unitImageSrc && (
        <div className="absolute inset-0 p-[2%] flex items-center justify-center">
          {/* Margin logic from Settings applied via padding or here? 
                 BoardScene used boardSettings margins. 
                 Here we just fill, maybe apply simple padding. 
             */}
          <img
            src={unitImageSrc}
            alt="Unit"
            className="max-w-full max-h-full object-contain drop-shadow-md"
            style={{
              // Simple pixel art scaling
              imageRendering: 'pixelated'
            }}
          />
        </div>
      )}

      {/* Interactable Overlay Hint (Optional) */}
      {/* <div className="absolute inset-0 bg-red-500/0 hover:bg-white/5 transition-colors rounded-xl" /> */}

      {/* Target Pulse */}
      {isTargetable && (
        <div className="absolute inset-0 border-4 border-green-400/50 rounded-xl pointer-events-none animate-pulse" />
      )}

      {/* Badges */}
      {slotModifier !== 0 && (
        <div
          className={`
            absolute left-1/2 -translate-x-1/2
            ${isPlayerSlot ? '-bottom-2' : '-top-2'}
            px-3 py-1 rounded-full text-xs font-bold
            ${slotModifier > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
            border border-stone-800 shadow-sm z-30
          `}
        >
          {slotModifier > 0 ? '+' : ''}{slotModifier}
        </div>
      )}

      {winner === playerId && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl z-30 drop-shadow-md">
          👑
        </div>
      )}

      {/* Power Circle */}
      <PowerCircle
        power={power}
        powerState={powerState}
        owner={isPlayerSlot ? 'player' : 'enemy'}
      />

    </div>
  );
};
