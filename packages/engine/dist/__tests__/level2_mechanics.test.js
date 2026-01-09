import { describe, it, expect } from 'vitest';
import { GameEngine } from '../core/GameEngine';
import { createStarter1Deck } from '../utils/deckBuilder';
import { TestController } from './utils/TestController';
describe('Level 2: Mechanics Tests (Combat & Rules)', () => {
    const setupGame = async () => {
        const p0 = new TestController(0);
        const p1 = new TestController(1);
        const engine = new GameEngine(p0, p1);
        p0.setEngine(engine);
        p1.setEngine(engine);
        const deck0 = createStarter1Deck(0, engine);
        const deck1 = createStarter1Deck(1, engine);
        await engine.initializeGame(deck0, deck1, 'rookie', 'rookie', 0);
        return { engine, p0, p1 };
    };
    const findCard = (hand, idPart) => hand.find(c => c.id.includes(idPart));
    it('should handle Combat, Damage, and Terrain Winning correctly', async () => {
        const { engine } = await setupGame();
        // --- Turn 1 (P0) ---
        // P0 Plays Veteran (Power 4) to Terrain 0
        let p0Hand = engine.state.players[0].hand;
        const veteran = findCard(p0Hand, 'veteran'); // p0_veteran_...
        expect(veteran).toBeDefined();
        await engine.processAction({
            type: 'PLAY_CARD',
            playerId: 0,
            cardId: veteran.id,
            targetSlot: { playerId: 0, terrainId: 0 }
        });
        // Verify Veteran deployed
        const t0_p0 = engine.state.terrains[0].slots[0].unit;
        expect(t0_p0).toBeDefined();
        expect(t0_p0.power).toBe(4); // Base power
        // Current Winner check (P0 4 vs P1 0) -> P0 waits? No, logic is instant usually for preview
        expect(engine.calculateTerrainWinner(0)).toBe(0);
        // --- Turn 1 (P1) ---
        // P1 Plays Archer (Power 3, Deal 2 Damage) to Terrain 0 (Opposite)
        let p1Hand = engine.state.players[1].hand;
        const archer = findCard(p1Hand, 'archer');
        expect(archer).toBeDefined();
        await engine.processAction({
            type: 'PLAY_CARD',
            playerId: 1,
            cardId: archer.id,
            targetSlot: { playerId: 1, terrainId: 0 }
        });
        // Verify Archer deployed
        const t0_p1 = engine.state.terrains[0].slots[1].unit;
        expect(t0_p1).toBeDefined();
        // expect((t0_p1 as any).power).toBe(3); // Base power
        // Verify Archer Effect (Deals 2 damage to unit in front)
        // Veteran starts 4. Takes 2 damage. Should be 2.
        const t0_p0_after = engine.state.terrains[0].slots[0].unit;
        expect(t0_p0_after.power).toBe(2);
        // Verify Winner Calculation
        // P0 (Veteran): 2 Power
        // P1 (Archer): 3 Power
        // Winner should be P1
        expect(engine.calculateTerrainWinner(0)).toBe(1);
    }, 10000);
    it('should kill a unit if damage exceeds power', async () => {
        const { engine } = await setupGame();
        // P0 Plays Archer (Power 3)
        const archer = findCard(engine.state.players[0].hand, 'archer');
        await engine.processAction({
            type: 'PLAY_CARD',
            playerId: 0,
            cardId: archer.id,
            targetSlot: { playerId: 0, terrainId: 1 } // Terrain 1
        });
        // P1 Plays Strike (Deal 3 Damage) on Archer
        const strike = findCard(engine.state.players[1].hand, 'strike');
        expect(strike).toBeDefined();
        await engine.processAction({
            type: 'PLAY_CARD',
            playerId: 1,
            cardId: strike.id,
            targetSlot: { playerId: 0, terrainId: 1 } // Target P0's unit on Terrain 1
        });
        // Verify Archer Died
        const slot = engine.state.terrains[1].slots[0];
        expect(slot.unit).toBeFalsy(); // Should be empty (null or undefined)
        // Check Graveyard
        expect(engine.state.players[0].graveyard.length).toBeGreaterThan(0);
        expect(engine.state.players[0].graveyard[0].id).toBe(archer.id);
    });
});
