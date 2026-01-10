import { PlayerId } from '../core/types';
import { HumanController } from '../controllers/HumanController';
import { AIController } from '../controllers/AIController';
import { ClaudeAI } from '../ai/ClaudeAI';
import { GameEngine } from '../core/GameEngine';
import { createStarter1Deck, createStarter2Deck } from '../utils/deckBuilder';

export interface GameCreationResult {
    engine: GameEngine;
    localPlayerId: PlayerId;
    gameMode: string;
    start: () => Promise<void>;
}

export const createGame = async (
    localPlayerId: PlayerId, 
    mode: 'vs-ai' | 'human-vs-human' | 'god-mode' = 'vs-ai',
    options: { autoStart?: boolean } = { autoStart: true }
): Promise<GameCreationResult> => {
    const isHumanVsHuman = mode === 'human-vs-human' || mode === 'god-mode';
    let controller0: any, controller1: any;
    let claudeAI0: ClaudeAI | null = null;
    let claudeAI1: ClaudeAI | null = null;

    if (isHumanVsHuman) {
        controller0 = new HumanController(0);
        controller1 = new HumanController(1);
    } else {
        // vs-ai mode
        if (localPlayerId === 0) {
            controller0 = new HumanController(0);
            claudeAI1 = new ClaudeAI(1);
            controller1 = new AIController(1, {} as any, claudeAI1); // Temp mock for store
        } else {
            claudeAI0 = new ClaudeAI(0);
            controller0 = new AIController(0, {} as any, claudeAI0);
            controller1 = new HumanController(1);
        }
    }

    const engine = new GameEngine(controller0, controller1);

    // Circular deps fix
    if (controller0 instanceof AIController) (controller0 as any).engine = engine;
    if (controller1 instanceof AIController) (controller1 as any).engine = engine;
    if (claudeAI0) claudeAI0.setEngine(engine);
    if (claudeAI1) claudeAI1.setEngine(engine);

    // Create Decks
    const deck0 = createStarter1Deck(0, engine);
    const deck1 = createStarter2Deck(1, engine);

    // Rigging: Always start with Player 0 for testing user flow
    const startingPlayer = 0; 
    
    const start = async () => {
        // Initialize with standard decks and heroes
        await engine.initializeGame(deck0 as any, deck1 as any, 'rookie', 'rookie', startingPlayer);
    };

    if (options.autoStart) {
        await start();
    }

    return { engine, localPlayerId, gameMode: mode, start };
};
