import React, { useState } from 'react';
import type { Card as CardType } from '@skirmish/engine';
import { DraggableCard } from './DraggableCard';

interface HandProps {
  cards: CardType[];
  isLocalPlayer: boolean;
  isOpen?: boolean;
  isTop?: boolean;
}

/**
 * Hand Component
 * Displays cards in a fanned arc (from ui_specs.md)
 * - Default: Fanned with rotation (-10deg to 10deg)
 * - Hover: Card pops up, straightens, scales to 1.1
 * - Smooth spring animations
 */
export const Hand: React.FC<HandProps> = ({
  cards,
  isLocalPlayer,
  isOpen = false,
  isTop = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const cardCount = cards.length;
  const maxRotation = 10; // degrees
  const cardSpacing = 90; // horizontal spacing (increased from 70)

  // Calculate transform for each card in the fan
  const getCardTransform = (index: number) => {
    const centerIndex = (cardCount - 1) / 2;
    const offset = index - centerIndex;

    // Fan rotation (more spread if few cards)
    const rotation = (offset / Math.max(cardCount, 5)) * maxRotation;

    // Horizontal position
    const x = offset * cardSpacing;

    // Vertical arc (cards at edges are higher)
    const yArc = Math.abs(offset) * 5;

    return { rotation, x, yOffset: yArc };
  };

  const showFaces = isLocalPlayer || isOpen;

  if (!showFaces) {
    // Show fanned card backs for opponent
    return (
      <div className="relative h-64 flex items-start justify-center">
        <div className="relative" style={{ width: `${cardCount * cardSpacing + 150}px` }}>
          {cards.map((_, index) => {
            const { rotation, x, yOffset } = getCardTransform(index);

            return (
              <div
                key={index}
                className="absolute left-1/2 top-0"
                style={{
                  transform: `translateX(calc(-50% + ${x}px))`,
                  zIndex: index,
                }}
              >
                <div
                  className="w-32 h-48 bg-amber-600 rounded-lg border-2 border-stone-800 shadow-md flex items-center justify-center"
                  style={{
                    transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
                  }}
                >
                  <span className="font-hand text-2xl text-amber-900">?</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }


  return (
    <div className={`relative h-64 flex ${isTop ? 'items-start' : 'items-end'} justify-center`}>
      <div className="relative" style={{ width: `${cardCount * cardSpacing + 150}px` }}>
        {cards.map((card, index) => {
          const { rotation, x, yOffset } = getCardTransform(index);
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={card.id}
              className={`absolute left-1/2 ${isTop ? 'top-0' : 'bottom-0'}`}
              style={{
                transform: `translateX(calc(-50% + ${x}px))`,
                zIndex: isHovered ? 50 : index,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <DraggableCard
                card={card}
                rotation={rotation}
                yOffset={yOffset}
                isHovered={isHovered}
                isTop={isTop}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
