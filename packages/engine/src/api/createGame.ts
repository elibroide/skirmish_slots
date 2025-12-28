import { PlayerId } from '../core/types';
import { HumanController } from '../controllers/HumanController';
import { AIController } from '../controllers/AIController';
import { ClaudeAI } from '../ai/ClaudeAI';
import { GameEngine } from '../core/GameEngine';
import { createStarter1Deck } from '../utils/deckBuilder';

export interface GameCreationResult {
    engine: GameEngine;
    localPlayerId: PlayerId;
    gameMode: string;
}

export const createGame = (localPlayerId: PlayerId, mode: 'vs-ai' | 'human-vs-human' | 'god-mode' = 'vs-ai'): GameCreationResult => {
    const isHumanVsHuman = mode === 'human-vs-human' || mode === 'god-mode';
    let controller0, controller1;
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
    const deck1 = createStarter1Deck(1, engine);

    // Rigging: Always start with Player 0 in Human-vs-Human / God Mode
    const startingPlayer = isHumanVsHuman ? 0 : undefined; 
    engine.initializeGame(deck0 as any, deck1 as any, 'sage', 'warlord', startingPlayer);

    return { engine, localPlayerId, gameMode: mode };
};
