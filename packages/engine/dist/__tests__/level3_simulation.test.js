import { describe, it, expect } from 'vitest';
import { GameEngine } from '../core/GameEngine';
import { createStarter1Deck } from '../utils/deckBuilder';
import { AIController } from '../controllers/AIController';
describe('Level 3: Global Simulation (Bot Battle)', () => {
    it('should run a full match between two RandomAIs without crashing', async () => {
        const engineHolder = { engine: null };
        // Use 0 delays for instant simulation
        const options = { actionDelay: 0, inputDelay: 0 };
        const p0 = new AIController(0, {
            get state() { return engineHolder.engine.state; },
            get logger() { return engineHolder.engine.logger; },
            submitAction: (...args) => engineHolder.engine.submitAction(...args),
            submitInput: (...args) => engineHolder.engine.submitInput(...args),
        }, undefined, options);
        const p1 = new AIController(1, {
            get state() { return engineHolder.engine.state; },
            get logger() { return engineHolder.engine.logger; },
            submitAction: (...args) => engineHolder.engine.submitAction(...args),
            submitInput: (...args) => engineHolder.engine.submitInput(...args),
        }, undefined, options);
        const engine = new GameEngine(p0, p1);
        engineHolder.engine = engine;
        // 2. Initialize Game
        const deck0 = createStarter1Deck(0, engine);
        const deck1 = createStarter1Deck(1, engine);
        await engine.initializeGame(deck0, deck1, 'rookie', 'rookie', 0);
        // 3. Run Simulation Loop
        // With 0 delay, the AI actions happen on microtask queue.
        // We just need to wait for things to settle.
        let ticks = 0;
        const MAX_TICKS = 500;
        // Run until Skirmish 2 starts
        while (engine.state.currentSkirmish === 1 && ticks < MAX_TICKS) {
            // Wait for microtasks (AI actions) to process
            await new Promise(resolve => setTimeout(resolve, 0));
            ticks++;
        }
        // 4. Assertions
        const state = engine.state;
        console.log(`Simulation Ended. Skirmish: ${state.currentSkirmish}, Turn: ${state.currentTurn}`);
        // Expect match to be concluded or at least progressed multiple skirmishes
        // If MAX_TICKS reached, checking progress
        if (ticks >= MAX_TICKS) {
            console.warn('Simulation hit tick limit!');
        }
        expect(state.currentSkirmish).toBeGreaterThan(1);
        // Ideally match winner is set (best of 3 usually?)
        // If using standard logic: yes.
        // Log final scores
        console.log('Skirmish History:', engine.game.skirmishHistory);
    }, 20000);
});
