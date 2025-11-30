import { motion } from 'framer-motion';
import type { UnitCard } from '../../engine/types';

interface UnitProps {
  unit: UnitCard;
  playerId: 0 | 1;
}

export function Unit({ unit, playerId }: UnitProps) {
  const playerColor = playerId === 0 ? 'player1' : 'player2';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={`
        w-full h-full flex flex-col items-center justify-center
        bg-gradient-to-br from-${playerColor} to-${playerColor}-dark
        rounded-lg shadow-lg p-2
      `}
    >
      {/* Power */}
      <div className="text-4xl font-bold text-white drop-shadow-lg">
        {unit.power}
      </div>

      {/* Name */}
      <div className="text-xs font-semibold text-white/90 text-center mt-1">
        {unit.name}
      </div>
    </motion.div>
  );
}
