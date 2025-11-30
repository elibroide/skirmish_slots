// Simple test to verify the game engine works
import { initializeGame } from './dist/skirmish.js';

try {
  console.log('Testing game initialization...');
  const game = initializeGame();
  console.log('✓ Game initialized successfully');
  console.log('State:', {
    round: game.state.currentRound,
    player0Hand: game.state.players[0].hand.length,
    player1Hand: game.state.players[1].hand.length,
  });
} catch (error) {
  console.error('✗ Error:', error.message);
}
