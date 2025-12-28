import { GameEngine } from '@skirmish/engine';
import { HumanController } from '@skirmish/engine';
import { NetworkController } from './NetworkController';
import { FirebaseService, type FirebaseConfig } from './firebase';
import { NetworkSync } from './NetworkSync';
import { CommandBuffer } from './CommandBuffer';
import { createDeck } from '@skirmish/engine';
import type { PlayerId } from '@skirmish/engine';

/**
 * NetworkGameManager - High-level API for creating and joining network games
 * 
 * Orchestrates the creation of all network components and wires them together:
 * - Firebase service
 * - CommandBuffer
 * - NetworkSync
 * - Controllers (Human for local, Network for remote)
 * - GameEngine with seed and command callback
 */
export class NetworkGameManager {
  private firebase: FirebaseService;

  constructor(firebaseConfig: FirebaseConfig) {
    this.firebase = new FirebaseService(firebaseConfig);
  }

  /**
   * Create a new network game
   * 
   * @param localPlayerId - Which player is local (0 or 1)
   * @param localDeckIds - Local player's deck (array of card IDs)
   * @param remoteDeckIds - Remote player's deck (array of card IDs)
   * @param seed - Optional seed (generated if not provided)
   * @returns Configured game engine ready to play
   */
  async createGame(
    localPlayerId: PlayerId,
    localDeckIds: string[],
    remoteDeckIds: string[],
    seed?: number
  ): Promise<{
    engine: GameEngine;
    gameId: string;
    code: string;
    networkSync: NetworkSync;
    deck0Ids: string[];
    deck1Ids: string[];
  }> {
    // Generate seed if not provided
    const gameSeed = seed ?? Math.floor(Math.random() * 1000000);

    // Determine deck order based on player ID
    const [deck0Ids, deck1Ids] = localPlayerId === 0
      ? [localDeckIds, remoteDeckIds]
      : [remoteDeckIds, localDeckIds];

    // Create game in Firebase and get code
    const { gameId, code } = await this.firebase.createGame(gameSeed, deck0Ids, deck1Ids);

    // Set up network infrastructure
    const commandBuffer = new CommandBuffer();

    // Create controllers
    const remotePlayerId = (1 - localPlayerId) as PlayerId;
    
    // We'll create the engine first, then create controllers with engine reference
    let engine: GameEngine;

    // Create controllers array based on player ID
    if (localPlayerId === 0) {
      const humanController = new HumanController(0);
      engine = new GameEngine(
        humanController,
        {} as NetworkController, // Temporary placeholder
        { seed: gameSeed }
      );
      const networkController = new NetworkController(1, engine, commandBuffer);
      (engine as any).controllers[1] = networkController;
    } else {
      engine = new GameEngine(
        {} as NetworkController, // Temporary placeholder
        new HumanController(1),
        { seed: gameSeed }
      );
      const networkController = new NetworkController(0, engine, commandBuffer);
      (engine as any).controllers[0] = networkController;
    }

    // Create NetworkSync (subscribes to engine events automatically)
    const networkSync = new NetworkSync(gameId, commandBuffer, this.firebase, localPlayerId, engine);

    // Start listening for remote commands
    networkSync.startListening();

    // Set this player as ready
    await this.firebase.setPlayerReady(gameId, localPlayerId);

    // Return engine (NOT initialized yet - will be initialized when both players ready)
    return { engine, gameId, code, networkSync, deck0Ids, deck1Ids };
  }

  /**
   * Join an existing network game by code
   * 
   * @param code - The 6-digit game code
   * @param localPlayerId - Which player is local (0 or 1)
   * @param localDeckIds - Local player's deck (array of card IDs)
   * @returns Configured game engine that will catch up to current state
   */
  async joinGameByCode(
    code: string,
    localPlayerId: PlayerId,
    localDeckIds: string[]
  ): Promise<{
    engine: GameEngine;
    gameId: string;
    code: string;
    networkSync: NetworkSync;
    deck0Ids: string[];
    deck1Ids: string[];
  }> {
    // Find game by code
    const gameId = await this.firebase.findGameByCode(code);
    if (!gameId) {
      throw new Error(`Game with code ${code} not found`);
    }

    // Get game data
    const gameData = await this.firebase.getGame(gameId);
    if (!gameData) {
      throw new Error(`Game ${gameId} not found`);
    }

    // Set up network infrastructure
    const commandBuffer = new CommandBuffer();

    // Determine which deck is which based on player ID
    const [deck0Ids, deck1Ids] = localPlayerId === 0
      ? [localDeckIds, gameData.player1.deckIds]
      : [gameData.player0.deckIds, localDeckIds];

    // Create controllers
    const remotePlayerId = (1 - localPlayerId) as PlayerId;
    let engine: GameEngine;

    if (localPlayerId === 0) {
      const humanController = new HumanController(0);
      engine = new GameEngine(
        humanController,
        {} as NetworkController,
        { seed: gameData.seed }
      );
      const networkController = new NetworkController(1, engine, commandBuffer);
      (engine as any).controllers[1] = networkController;
    } else {
      engine = new GameEngine(
        {} as NetworkController,
        new HumanController(1),
        { seed: gameData.seed }
      );
      const networkController = new NetworkController(0, engine, commandBuffer);
      (engine as any).controllers[0] = networkController;
    }

    // Create NetworkSync
    const networkSync = new NetworkSync(gameId, commandBuffer, this.firebase, localPlayerId, engine);
    networkSync.startListening();

    // Load any existing actions
    await networkSync.loadAllActions();

    // Set this player as ready
    await this.firebase.setPlayerReady(gameId, localPlayerId);

    // Return engine (NOT initialized yet - will be initialized when both players ready)
    return { engine, gameId, code, networkSync, deck0Ids, deck1Ids };
  }

  /**
   * Get Firebase service (for advanced usage)
   */
  getFirebaseService(): FirebaseService {
    return this.firebase;
  }
}

