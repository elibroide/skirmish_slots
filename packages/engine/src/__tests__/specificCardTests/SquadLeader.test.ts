import { describe, it, expect, vi } from 'vitest';
import { GameEngine } from '../../core/GameEngine';
import { createUnitCard } from '../../mechanics/cards/CardFactory';
import { PlayerController } from '../../controllers/PlayerController';

class MockController implements PlayerController {
    constructor(public playerId: any, public type: 'human' | 'ai') {}
    onEvent(event: any) {}
    onRequestAction(request: any) {}
}

describe('Card: Squad Leader', () => {
    it('Deploy: Grant Shield and Trigger Fight', async () => {
        const engine = new GameEngine(new MockController(0, 'human'), new MockController(1, 'human'), { seed: 123 });
        await engine.initializeGame([], []);
        
        // Setup Allies
        // Soldier Ally
        const soldierAlly = createUnitCard('test_dummy_enforcer', 0 as any, engine);
        await soldierAlly.deploy(0 as any); // Slot 0
        
        // Non-Soldier Ally
        const otherAlly = createUnitCard('acolyte_of_spring', 0 as any, engine);
        await otherAlly.deploy(2 as any); // Slot 2
        
        // Setup Enemies
        // Opponent fo Soldier Ally
        const enemy1 = createUnitCard('test_dummy', 1 as any, engine); // Enemy
        await enemy1.deploy(0 as any); // Opposite Slot 0
        
        // Subject: Squad Leader
        const leader = createUnitCard('squad_leader', 0 as any, engine);
        
        // Deploy Squad Leader (Slot 2)
        // Squad Leader Effect:
        // 1. Close Soldiers get +2 Shield (Cadet is Soldier, Acolyte is Not).
        // 2. Close Allies fight opposing enemies.
        
        // Mock Fight
        await leader.deploy(1 as any); 
        await (engine as any).processEffectStack();
        
        // Assertions
        
        // 1. Shield Check
        expect(soldierAlly.shield).toBe(0); // Consumed in fight
        expect(otherAlly.shield).toBe(0);
        
        // 2. Fight Check
        expect(otherAlly.damage).toBe(0);
        expect(soldierAlly.damage).toBe(3);
        expect(enemy1.damage).toBe(4);
    });
});
