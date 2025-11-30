import { motion } from 'framer-motion';
import type { Card as CardType } from '../../engine/types';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export function Card({ card, onClick, selected = false, disabled = false }: CardProps) {
  const isPowerCard = 'power' in card;

  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.05, y: -4 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={disabled ? undefined : onClick}
      className={`
        card w-32 h-44 flex flex-col justify-between
        ${selected ? 'ring-4 ring-blue-500' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        hover:shadow-2xl
      `}
    >
      {/* Card Header */}
      <div className="flex justify-between items-start">
        <div className="text-sm font-bold text-gray-100">{card.name}</div>
        {isPowerCard && (
          <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
            {(card as any).power}
          </div>
        )}
      </div>

      {/* Card Type */}
      <div className="text-xs text-gray-400 uppercase">
        {isPowerCard ? 'Unit' : 'Action'}
      </div>

      {/* Spacer */}
      <div className="flex-1" />
    </motion.div>
  );
}
