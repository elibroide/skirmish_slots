import { describe, it, expect } from 'vitest';
import { GameEngine } from '../core/GameEngine';
import { createStarter1Deck } from '../utils/deckBuilder';
import { HumanController } from '../controllers/HumanController';
describe('Level 1: Smoke Tests (Game Loop)', () => {
    // Helper to setup a vanilla game
    const setupGame = async () => {
        const p0 = new HumanController(0);
        const p1 = new HumanController(1);
        const engine = new GameEngine(p0, p1);
        // Inject simple decks
        const deck0 = createStarter1Deck(0, engine);
        const deck1 = createStarter1Deck(1, engine);
        // Initialize with P0 as starting player
        await engine.initializeGame(deck0, deck1, 'rookie', 'rookie', 0);
        return { engine, p0, p1 }; // Return initialized engine
    };
    it('should initialize the game correctly', async () => {
        const { engine } = await setupGame();
        const state = engine.state;
        expect(state.currentSkirmish).toBe(1);
        expect(state.currentTurn).toBe(1);
        expect(state.players[0].hand.length).toBeGreaterThan(0);
        expect(state.players[1].hand.length).toBeGreaterThan(0);
        expect(state.players[0].hand.length).toBe(8); // Initial hand size
        expect(state.currentPlayer).toBe(0); // Player 0 starts usually
    });
    it('should allow Player 0 to play a Unit', async () => {
        const { engine, p0 } = await setupGame();
        // Find a playable unit (Unit type)
        const hand = engine.state.players[0].hand;
        const unitCard = hand.find(c => c.type === 'unit' || c.power !== undefined);
        expect(unitCard).toBeDefined();
        // Play it to Slot 0, Terrain 0
        const action = {
            type: 'PLAY_CARD',
            playerId: 0,
            cardId: unitCard.id,
            targetSlot: { playerId: 0, terrainId: 0 }
        };
        await engine.processAction(action);
        // Verify state update
        const state = engine.state;
        // Turn should pass
        expect(state.currentPlayer).toBe(1);
        // Unit should be on board
        const terrain = state.terrains[0];
        const slot = terrain.slots[0];
        expect(slot.unit).toBeDefined();
        // Check ID via casting or any since StateSnapshot might strip methods
        expect(slot.unit.id).toBe(unitCard.id);
        // Hand size reduced
        expect(state.players[0].hand.length).toBe(7);
    });
    it('should end skirmish when both players pass', async () => {
        const { engine } = await setupGame();
        // Player 0 Passes
        await engine.processAction({ type: 'PASS', playerId: 0 });
        expect(engine.state.players[0].isDone).toBe(true);
        expect(engine.state.currentPlayer).toBe(1);
        // Player 1 Passes
        await engine.processAction({ type: 'PASS', playerId: 1 });
        // Skirmish End Verification
        // Skirmish Should Increment
        expect(engine.state.currentSkirmish).toBe(2);
        // Both players are reset to "Not Done" for new Skirmish
        expect(engine.state.players[0].isDone).toBe(false);
        expect(engine.state.players[1].isDone).toBe(false);
    });
});
