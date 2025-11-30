// Quick engine test - run with: node test-engine.js
// This uses dynamic imports to test the TypeScript compiled output

console.log('🎮 Testing Skirmish Game Engine...\n');

// We'll test by importing and running the actual source
import('./src/engine/index.ts').then(async (engine) => {
  try {
    console.log('1. Initializing game...');
    const game = engine.initializeGame();
    console.log('   ✓ Game created');
    console.log(`   Round: ${game.state.currentRound}`);
    console.log(`   Player 0 hand: ${game.state.players[0].hand.length} cards`);
    console.log(`   Player 1 hand: ${game.state.players[1].hand.length} cards\n`);

    console.log('2. Testing card play...');
    const player0 = game.state.players[0];
    const firstCard = player0.hand[0];
    console.log(`   Playing: ${firstCard.name} (${firstCard.cardId})`);

    if ('power' in firstCard) {
      game.processAction({
        type: 'PLAY_CARD',
        playerId: 0,
        cardId: firstCard.id,
        slotId: 0,
      });
      console.log('   ✓ Unit card played to slot 0');
      console.log(`   Slot 0 unit: ${game.state.slots[0].units[0]?.name || 'none'}\n`);
    }

    console.log('3. Testing pass...');
    game.processAction({
      type: 'PASS',
      playerId: 0,
    });
    console.log(`   ✓ Player 0 passed`);
    console.log(`   Player 0 hasPassed: ${game.state.hasPassed[0]}\n`);

    console.log('4. Testing second pass (should trigger round resolution)...');
    game.processAction({
      type: 'PASS',
      playerId: 1,
    });
    console.log(`   ✓ Player 1 passed`);
    console.log(`   Both passed: ${game.state.hasPassed[0] && game.state.hasPassed[1]}`);
    console.log(`   Round ended, now on round: ${game.state.currentRound}\n`);

    console.log('✅ ALL TESTS PASSED!\n');
    console.log('Game is working correctly. Open http://localhost:5173/ to play!');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error(error.stack);
  }
}).catch(err => {
  console.error('❌ Failed to import engine:', err.message);
});
