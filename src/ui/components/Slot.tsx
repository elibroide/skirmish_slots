import { motion } from 'framer-motion';
import { Unit } from './Unit';
import type { Slot as SlotType, SlotId } from '../../engine/types';

interface SlotProps {
  slot: SlotType;
  slotId: SlotId;
  onSlotClick: (slotId: SlotId) => void;
  canPlay: boolean;
  highlighted: boolean;
}

export function Slot({ slot, slotId, onSlotClick, canPlay, highlighted }: SlotProps) {
  const unit0 = slot.units[0];
  const unit1 = slot.units[1];
  const hasEffects = slot.ongoingEffects.length > 0;

  return (
    <div className="flex flex-col gap-2 items-center">
      {/* Player 1 Unit (top) */}
      <motion.div
        className={`
          w-28 h-36 rounded-lg border-2
          ${unit1 ? 'border-player2' : 'border-gray-700'}
          ${hasEffects ? 'bg-purple-900/20' : 'bg-gray-800'}
        `}
      >
        {unit1 && <Unit unit={unit1} playerId={1} />}
      </motion.div>

      {/* Slot Info */}
      <div className="text-xs text-gray-400 font-mono">Slot {slotId + 1}</div>

      {/* Effects indicator */}
      {hasEffects && (
        <div className="text-xs text-purple-400">
          {slot.ongoingEffects.length} effect{slot.ongoingEffects.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Player 0 Unit (bottom) */}
      <motion.div
        onClick={canPlay ? () => onSlotClick(slotId) : undefined}
        whileHover={canPlay ? { scale: 1.05 } : {}}
        className={`
          w-28 h-36 rounded-lg border-2
          ${unit0 ? 'border-player1' : 'border-gray-700'}
          ${highlighted ? 'border-yellow-400 border-4 shadow-lg shadow-yellow-400/50' : ''}
          ${canPlay ? 'cursor-pointer hover:border-blue-400' : ''}
          ${hasEffects ? 'bg-purple-900/20' : 'bg-gray-800'}
        `}
      >
        {unit0 && <Unit unit={unit0} playerId={0} />}
      </motion.div>
    </div>
  );
}
