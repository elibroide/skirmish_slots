/**
 * Example: Creating a Network Multiplayer Game
 * 
 * This file demonstrates how to set up a network game using the
 * Event Sourcing multiplayer architecture.
 */

import { NetworkGameManager } from './NetworkGameManager';
import { createCard } from '../engine/cards';
import type { FirebaseConfig } from './firebase';
import type { GameEngine } from '../engine/GameEngine';

/**
 * Step 1: Configure Firebase
 * Get these values from your Firebase project console
 */
const firebaseConfig: FirebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com", // Required for Realtime Database
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

/**
 * Step 2: Build decks
 * 
 * Note: In real usage, you'd get deck Card instances from your deck builder
 * This is just for illustration
 */
function buildExampleDeck(owner: number, engine: GameEngine) {
  const cardIds = [
    // 23 Units (need at least 15)
    'rookie', 'rookie', 'rookie',
    'scout', 'scout',
    'archer', 'archer',
    'knight', 'knight',
    'priest', 'ranger', 'rogue', 'veteran', 'wizard',
    'champion', 'engineer', 'bard', 'hunter', 'noble',
    'necromancer', 'warlock', 'vampire', 'dragon',
    
    // 7 Actions
    'strike', 'strike',
    'fireball', 'assassinate', 'energize', 'unsummon', 'repositioning',
  ];
  
  return cardIds.map(id => createCard(id, owner as 0 | 1, engine));
}

/**
 * Step 3: Create the network game
 */
async function createNetworkGame(player0Deck: any[], player1Deck: any[]) {
  try {
    // Initialize manager
    const manager = new NetworkGameManager(firebaseConfig);
    
    // Note: Decks should be arrays of Card instances from your deck builder
    
    // Create game (local player is Player 0)
    const { engine, gameId, networkSync } = await manager.createGame(
      0, // Local player ID
      player0Deck,
      player1Deck,
      Date.now() // Seed (or omit for random)
    );
    
    console.log('✅ Network game created!');
    console.log('📋 Game ID:', gameId);
    console.log('🎲 Seed:', engine.rng.getSeed());
    console.log('\n📤 Share the Game ID with your opponent so they can join!');
    
    // Set up desync detection
    networkSync.onDesync((event) => {
      console.error('❌ DESYNC DETECTED!');
      console.error('Expected:', event.expected);
      console.error('Actual:', event.actual);
      console.error('Sequence:', event.sequenceId);
      
      // In a real app, show an error modal to the user
      alert('Game state mismatch detected. The game may be out of sync.');
    });
    
    // Listen for game events (for UI updates)
    engine.onEvent((event) => {
      console.log('🎮 Game Event:', event.type);
      
      if (event.type === 'MATCH_ENDED') {
        console.log('🏆 Game Over! Winner:', event.winner);
        
        // Update Firebase status
        manager.getFirebaseService().updateGameStatus(gameId, 'completed');
        
        // Stop network sync
        networkSync.stop();
      }
    });
    
    // At this point, the game is running!
    // The engine will emit ACTION_REQUIRED events when it's the player's turn.
    // Your UI should listen for these events and call engine.submitAction()
    // with the player's chosen action.
    
    return { engine, gameId, networkSync, manager };
    
  } catch (error) {
    console.error('❌ Failed to create network game:', error);
    throw error;
  }
}

/**
 * Step 4: Submit actions (called by your UI)
 */
async function examplePlayerAction(engine: any) {
  // Get current player's hand
  const currentPlayer = engine.state.currentPlayer;
  const hand = engine.state.players[currentPlayer].hand;
  
  if (hand.length === 0) {
    // No cards left, pass
    await engine.submitAction({
      type: 'PASS',
      playerId: currentPlayer
    });
    return;
  }
  
  // Play first card
  const card = hand[0];
  const targetSlot = card.selectDefaultTarget(engine.state);
  
  await engine.submitAction({
    type: 'PLAY_CARD',
    playerId: currentPlayer,
    cardId: card.id,
    targetSlot
  });
}

/**
 * Export for use in your app
 */
export {
  createNetworkGame,
  examplePlayerAction,
  buildExampleDeck
};

/**
 * Example usage in a React component or main game file:
 * 
 * ```typescript
 * import { createNetworkGame } from './network/example';
 * 
 * // In your game setup code:
 * const { engine, gameId } = await createNetworkGame();
 * 
 * // Store in your game state
 * setGameEngine(engine);
 * setGameId(gameId);
 * 
 * // Display game ID to user
 * alert(`Game created! ID: ${gameId}\nShare with opponent to join.`);
 * ```
 */

