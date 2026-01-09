import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../core/GameEngine';
import { createUnitCard } from '../../mechanics/cards/CardFactory';
import { PlayerController } from '../../controllers/PlayerController';

class MockController implements PlayerController {
    constructor(public playerId: any, public type: 'human' | 'ai') {}
    onEvent(event: any) {}
    onRequestAction(request: any) {}
}

describe('Card: Scrap Collector', () => {
    it('Triggers on Unit Death', async () => {
        const engine = new GameEngine(new MockController(0, 'human'), new MockController(1, 'human'), { seed: 123 });
        await engine.initializeGame([], []);
        
        // Scrap Collector: "When a close unit dies, I get +2 Power."
        // Setup:
        // P0 Slot 0: Scrap Collector (Base 2)
        // P0 Slot 1: Vanilla Ally (Acolyte)
        
        const collector = createUnitCard('scrap_collector', 0 as any, engine);
        await collector.deploy(0 as any);
        
        const victim = createUnitCard('acolyte_of_spring', 0 as any, engine);
        await victim.deploy(1 as any);
        
        expect(collector.power).toBe(2);
        
        // Kill Victim
        await victim.die('test_kill');
        await (engine as any).processEffectStack();
        
        // Assert
        // Collector should have triggered.
        // Base 2 + 2 = 4.
        expect(collector.power).toBe(4);
    });
});
