import { GameEngine } from '../core/GameEngine';
import { createStarterDeck } from '../utils/deckBuilder';
import { StartSkirmishEffect } from '../mechanics/effects/StartSkirmishEffect';
import { HumanController } from '../controllers/HumanController';
import { AIController } from '../controllers/AIController';
/**
 * Initialize a new game with two controllers
 * By default: Player 0 = Human, Player 1 = AI
 */
export function initializeGame(controller0, controller1, deck1, deck2) {
    // Create default controllers if not provided
    // IMPORTANT: We need to create engine first, then pass it to AIController
    // So we'll use a temporary engine for deck creation
    const tempEngine = {};
    const finalDeck1 = deck1 || createStarterDeck(0, tempEngine);
    const finalDeck2 = deck2 || createStarterDeck(1, tempEngine);
    // Create the actual game engine with controllers
    const ctrl0 = controller0 || new HumanController(0);
    let ctrl1 = controller1;
    const engine = new GameEngine(ctrl0, ctrl1);
    // Now create AI controller with real engine if needed
    if (!controller1) {
        ctrl1 = new AIController(1, engine);
        // Update the controllers array
        engine.controllers[1] = ctrl1;
    }
    // Update card references to real engine
    const updateCardEngine = (card) => {
        card.engine = engine;
    };
    finalDeck1.forEach(updateCardEngine);
    finalDeck2.forEach(updateCardEngine);
    engine.initializeGame(finalDeck1, finalDeck2);
    // Start the first skirmish
    engine.enqueueEffect(new StartSkirmishEffect());
    engine['processEffectStack']();
    // Emit initial ACTION_REQUIRED
    engine['checkForRequiredActions']();
    return engine;
}
