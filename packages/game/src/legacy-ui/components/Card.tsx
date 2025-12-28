import React from 'react';
import { motion } from 'framer-motion';
import type { Card as CardType, UnitCard } from '@skirmish/engine';

interface CardProps {
  card: CardType;
  isInHand?: boolean;
  rotation?: number;
  yOffset?: number;
  isDragging?: boolean;
  style?: React.CSSProperties;
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
  isInHand = false,
  rotation = 0,
  yOffset = 0,
  isDragging = false,
  style = {},
}) => {
  const isUnit = card.getType() === 'unit';
  const unitCard = isUnit ? (card as UnitCard) : null;

  const getPowerColor = () => {
    if (!unitCard) return 'text-stone-800';
    if (unitCard.power > unitCard.originalPower) return 'text-green-700';
    if (unitCard.power < unitCard.originalPower) return 'text-red-700';
    return 'text-stone-800';
  };

  return (
    <div
      className="
        w-32 h-48 rounded-lg border-2 border-stone-800 shadow-md
        bg-amber-50 relative select-none
      "
      style={{
        transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
        opacity: isDragging ? 0.5 : 1,
        cursor: isInHand ? 'grab' : 'pointer',
        ...style,
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

      {/* Shield Circle (bottom-left corner, only for units with shield > 0) */}
      {isUnit && unitCard && unitCard.shield > 0 && (
        <div
          className="
            absolute -bottom-3 -left-3 w-10 h-10 rounded-full
            bg-sky-400 border-2 border-stone-800 shadow-sm
            flex items-center justify-center
            font-bold text-xl text-white
          "
        >
          {unitCard.shield}
        </div>
      )}

      {/* Dominant Crown Icon (top-left corner, only for units with Dominant trait) */}
      {isUnit && unitCard && unitCard.hasDominant && (
        <div
          className={`
            absolute -top-2 -left-2 w-8 h-8 rounded-full
            border-2 border-stone-800 shadow-sm
            flex items-center justify-center text-lg
            ${unitCard.dominantTriggered
              ? 'bg-stone-300 opacity-50'  // Grayed out when triggered
              : 'bg-yellow-400'            // Active
            }
          `}
          title={unitCard.dominantTriggered ? 'Dominant: Already triggered' : 'Dominant: Active'}
        >
          👑
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
