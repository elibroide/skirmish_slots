import React from 'react';
import { motion } from 'framer-motion';
import type { Card as CardType, UnitCard } from '../../engine/types';

interface CardProps {
  card: CardType;
  onDragStart?: (cardId: string) => void;
  onDragEnd?: () => void;
  isInHand?: boolean;
  rotation?: number;
  yOffset?: number;
  index?: number;
}

/**
 * Card Component
 * Follows mockup design with:
 * - Parchment paper aesthetic (amber-50 body, amber-200 header)
 * - Patrick Hand font for name
 * - Power circle in bottom-right corner
 * - Border: stone-800 (ink black)
 */
export const Card: React.FC<CardProps> = ({
  card,
  onDragStart,
  onDragEnd,
  isInHand = false,
  rotation = 0,
  yOffset = 0,
  index = 0,
}) => {
  const isUnit = card.getType() === 'unit';
  const unitCard = isUnit ? (card as UnitCard) : null;

  // Power color coding (from ui_specs.md)
  const getPowerColor = () => {
    if (!unitCard) return 'text-stone-800';
    if (unitCard.power > unitCard.originalPower) return 'text-green-700'; // Buffed
    if (unitCard.power < unitCard.originalPower) return 'text-red-700'; // Damaged
    return 'text-stone-800'; // Normal
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('cardId', card.id);
      onDragStart(card.id);
    }
  };

  return (
    <div
      className="
        w-32 h-48 rounded-lg border-2 border-stone-800 shadow-md
        bg-amber-50 relative cursor-pointer select-none transition-transform duration-200
      "
      draggable={isInHand}
      onDragStart={isInHand ? handleDragStart : undefined}
      onDragEnd={isInHand ? onDragEnd : undefined}
      style={{
        transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
      }}
    >
      {/* Header - Card Name */}
      <div className="bg-amber-200 border-b-2 border-stone-800 p-1">
        <h3 className="font-hand font-bold text-lg leading-tight text-center text-stone-800">
          {card.name}
        </h3>
      </div>

      {/* Middle - Art placeholder */}
      <div className="bg-stone-300 flex-grow h-20 flex items-center justify-center">
        <span className="font-ui text-xs text-stone-500">Art</span>
      </div>

      {/* Bottom - Description */}
      <div className="p-2">
        <p className="font-ui text-xs leading-tight text-stone-700">
          {card.description}
        </p>
      </div>

      {/* Power Circle (bottom-right corner, only for units) */}
      {isUnit && unitCard && (
        <div
          className={`
          absolute -bottom-3 -right-3 w-10 h-10 rounded-full
          bg-orange-400 border-2 border-stone-800 shadow-sm
          flex items-center justify-center
          font-bold text-xl ${getPowerColor()}
        `}
        >
          {unitCard.power}
        </div>
      )}

      {/* Card Type Badge */}
      <div className="absolute top-1 right-1">
        <span className="font-ui text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-amber-50">
          {card.getType() === 'unit' ? 'UNIT' : 'ACT'}
        </span>
      </div>
    </div>
  );
};
