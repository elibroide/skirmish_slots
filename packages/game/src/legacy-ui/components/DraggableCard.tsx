import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card } from './Card';
import type { Card as CardType } from '@skirmish/engine';

interface DraggableCardProps {
  card: CardType;
  rotation?: number;
  yOffset?: number;
  isHovered?: boolean;
  isTop?: boolean;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  card,
  rotation = 0,
  yOffset = 0,
  isHovered = false,
  isTop = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex: isDragging ? 1000 : isHovered ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card
        card={card}
        isInHand={true}
        rotation={isHovered ? 0 : rotation}
        yOffset={isHovered ? (isTop ? 40 : -40) : yOffset}
        isDragging={isDragging}
      />
    </div>
  );
};

