import { motion } from 'framer-motion';

interface InfoPanelProps {
  currentPlayer: 0 | 1;
  player0VP: number;
  player1VP: number;
  player0RoundsWon: number;
  player1RoundsWon: number;
  currentRound: number;
  hasPassed: [boolean, boolean];
  onPass: () => void;
  matchWinner: 0 | 1 | null | undefined;
}

export function InfoPanel({
  currentPlayer,
  player0VP,
  player1VP,
  player0RoundsWon,
  player1RoundsWon,
  currentRound,
  hasPassed,
  onPass,
  matchWinner,
}: InfoPanelProps) {
  const canPass = !hasPassed[currentPlayer] && matchWinner === undefined;

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-gray-800 rounded-lg min-w-64">
      {/* Round Info */}
      <div className="text-center">
        <div className="text-sm text-gray-400 uppercase">Round</div>
        <div className="text-4xl font-bold text-blue-400">{currentRound}</div>
      </div>

      {/* Victory Points */}
      <div className="w-full space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Player 1 VP:</span>
          <span className="text-2xl font-bold text-player2">{player1VP}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Player 0 VP:</span>
          <span className="text-2xl font-bold text-player1">{player0VP}</span>
        </div>
      </div>

      {/* Rounds Won */}
      <div className="w-full space-y-2">
        <div className="text-sm text-gray-400 text-center">Rounds Won</div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Player 1:</span>
          <span className="text-xl font-bold text-player2">{player1RoundsWon}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Player 0:</span>
          <span className="text-xl font-bold text-player1">{player0RoundsWon}</span>
        </div>
      </div>

      {/* Current Turn Indicator */}
      <div className="text-center">
        <div className="text-sm text-gray-400 uppercase mb-2">Current Turn</div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`text-xl font-bold ${
            currentPlayer === 0 ? 'text-player1' : 'text-player2'
          }`}
        >
          Player {currentPlayer}
        </motion.div>
        {hasPassed[currentPlayer] && (
          <div className="text-sm text-yellow-400 mt-1">Passed</div>
        )}
      </div>

      {/* Pass Button */}
      <motion.button
        whileHover={canPass ? { scale: 1.05 } : {}}
        whileTap={canPass ? { scale: 0.95 } : {}}
        onClick={onPass}
        disabled={!canPass}
        className={`
          btn w-full py-3 text-lg font-bold
          ${canPass ? 'btn-secondary' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
        `}
      >
        {hasPassed[currentPlayer] ? 'Passed' : 'Pass'}
      </motion.button>

      {/* Match Winner */}
      {matchWinner !== undefined && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center p-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg"
        >
          <div className="text-sm uppercase font-bold">Match Winner!</div>
          <div className="text-2xl font-bold">
            {matchWinner === null ? 'Draw!' : `Player ${matchWinner}`}
          </div>
        </motion.div>
      )}
    </div>
  );
}
