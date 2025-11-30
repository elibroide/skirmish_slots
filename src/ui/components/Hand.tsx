import { motion } from 'framer-motion';
import { Card } from './Card';
import type { Card as CardType } from '../../engine/types';

interface HandProps {
  cards: CardType[];
  selectedCardId: string | null;
  onCardClick: (cardId: string) => void;
  disabled?: boolean;
}

export function Hand({ cards, selectedCardId, onCardClick, disabled = false }: HandProps) {
  return (
    <motion.div
      className="flex gap-3 justify-center p-4 bg-gray-800/50 rounded-lg min-h-52"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      {cards.length === 0 ? (
        <div className="text-gray-500 text-sm flex items-center">No cards in hand</div>
      ) : (
        cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            selected={selectedCardId === card.id}
            onClick={() => onCardClick(card.id)}
            disabled={disabled}
          />
        ))
      )}
    </motion.div>
  );
}
