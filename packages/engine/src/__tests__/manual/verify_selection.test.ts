
import { describe, it, expect, vi } from 'vitest';
import { GameEngine } from '../../core/GameEngine';
import { UnitCard } from '../../mechanics/cards/Card';
import { ReactionTrait } from '../../mechanics/core/traits/ReactionTrait';
import { PlayerController } from '../../controllers/PlayerController';

// Mock Controller
class MockController implements PlayerController {
    constructor(public playerId: any, public type: 'human' | 'ai') {}
    onEvent(event: any) {}
    onRequestAction(request: any) {}
}

describe('ReactionTrait Async Selection', () => {
  it('should pause for player input and apply effect to selected target', async () => {
    // 1. Setup Engine
    const p1 = new MockController(0, 'human');
    const p2 = new MockController(1, 'human');
    const engine = new GameEngine(p1, p2, { seed: 12345 });
    await engine.initializeGame([], []);

    // 2. Setup Board
    const hero = new UnitCard('hero', 'Hero', 'Deals Logic', 10, 0, engine);
    await hero.deploy(0 as any); 

    const enemy1 = new UnitCard('e1', 'Enemy 1', '-', 10, 1 as any, engine);
    const enemy2 = new UnitCard('e2', 'Enemy 2', '-', 10, 1 as any, engine);
    await enemy1.deploy(0 as any); // Terrain 0 (Opposing Hero)
    await enemy2.deploy(1 as any); // Terrain 1 

    // Force owner/terrain manually to ensure targeting logic works as expected if deploy didn't set it perfectly for this test
    // T0: Hero (P0)
    // T0: Enemy1 (P1) -> Opposing
    // T1: Enemy2 (P1) -> Different terrain
    console.log('Hero Terrain:', hero.terrainId, 'Owner:', hero.owner);
    console.log('Enemy1 Terrain:', enemy1.terrainId, 'Owner:', enemy1.owner);
    console.log('Enemy2 Terrain:', enemy2.terrainId, 'Owner:', enemy2.owner);
    
    // Check Engine Slots
    const t0 = engine.state.terrains[0];
    const t1 = engine.state.terrains[1];
    console.log('Slot 0,0 Unit:', t0.slots[0 as any].unit?.id);
    console.log('Slot 0,1 Unit:', t0.slots[1 as any].unit?.id);
    console.log('Slot 1,1 Unit:', t1.slots[1 as any].unit?.id);

    // 3. Setup Reaction
    const reactionTrait = new ReactionTrait(hero, {
        triggers: [{ type: 'ManualTest' }],
        effects: [{
            candidates: { 
                type: 'Relative', 
                proximity: 'All', 
                relationship: 'Enemy'
            },
            selection: { strategy: 'Player' },
            action: {
                type: 'AddPower',
                value: { type: 'static', value: -5 }
            }
        }]
    });
    hero.addTrait(reactionTrait);

    // 4. Mock Input Request
    const requestInputSpy = vi.fn().mockImplementation(async (req: any) => {
        if (req.type === 'select_target') {
            // Select Enemy 2 - ID might be prefixed (e.g. p1_e2_...)
            const target = req.candidates.find((c: any) => c.name === 'Enemy 2');
            if (!target) console.warn('Mock: Target Enemy 2 not found in candidates:', req.candidates.map((c: any) => c.name));
            return [target];
        }
        return [];
    });
    hero.requestInput = requestInputSpy;

    // 5. Trigger Reaction
    console.log('Emitting ManualTest event...');
    await engine.emitEvent({ type: 'ManualTest', playerId: 0 } as any);
    
    // Process Stack
    console.log('Processing Effect Stack...');
    await (engine as any).processEffectStack();

    // 6. Assertions
    expect(requestInputSpy).toHaveBeenCalled();
    const callArgs = requestInputSpy.mock.calls[0][0];
    expect(callArgs.type).toBe('select_target');
    expect(callArgs.candidates.length).toBeGreaterThan(0); // Should be at least 1 (e1, e2 both enemies?)

    // Enemy 1 should be untouched (10)
    expect(enemy1.power).toBe(10);

    // Enemy 2 should be debuffed (5)
    expect(enemy2.power).toBe(5);
  });
});
