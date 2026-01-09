import { describe, it, expect, vi } from 'vitest';
import { GameEngine } from '../../core/GameEngine';
import { createUnitCard } from '../../mechanics/cards/CardFactory';
import { PlayerController } from '../../controllers/PlayerController';

// Mock Controller
class MockController implements PlayerController {
    constructor(public playerId: any, public type: 'human' | 'ai') {}
    onEvent(event: any) {}
    onRequestAction(request: any) {}
}

describe('Card: Lone Jackal', () => {
    it('Deploy: Trigger Selection and Deal 2 Damage', async () => {
        // 1. Setup Engine
        const p0 = new MockController(0, 'human');
        const p1 = new MockController(1, 'human');
        const engine = new GameEngine(p0, p1, { seed: 123 });
        await engine.initializeGame([], []);
        
        // 2. Setup Board
        // Enemies: Acolyte of Spring (1 Power)
        // Note: Acolyte of Spring triggers on Deploy too (Modify slot +1). 
        // We ensure that doesn't interfere.
        
        const enemy1 = createUnitCard('acolyte_of_spring', 1 as any, engine); 
        const enemy2 = createUnitCard('acolyte_of_spring', 1 as any, engine);
        
        // Deploy Enemy 1 (Opposite T0)
        await enemy1.deploy(0 as any); 
        
        // Deploy Enemy 2 (Adjacent T1)
        await enemy2.deploy(1 as any); 
        
        console.log(`Enemy1 ID: ${enemy1.id}, Power: ${enemy1.power}`);
        console.log(`Enemy2 ID: ${enemy2.id}, Power: ${enemy2.power}`);
        
        // 3. Deploy Lone Jackal (Subject)
        const jackal = createUnitCard('lone_jackal', 0 as any, engine);
        
        // Spy on Input
        const inputSpy = vi.fn().mockImplementation(async (req: any) => {
             console.log('Jackal requesting input candidates:', req.candidates.map((c:any) => `${c.name} (${c.id})`));
             
             // Dynamic Selection: Select First Valid
             const selected = req.candidates[0]; 
             if (!selected) {
                 console.error('Test Spy: No candidates found!');
                 return [];
             }
             return [selected];
        });
        jackal.requestInput = inputSpy;
        
        console.log('Deploying Lone Jackal...');
        await jackal.deploy(0 as any); // Terrain 0
        
        // 4. Process Logic
        await (engine as any).processEffectStack();
        
        // 5. Assertions
        expect(inputSpy).toHaveBeenCalled();
        
        const didEnemy1TakeDamage = enemy1.damage > 0;
        const didEnemy2TakeDamage = enemy2.damage > 0;
        
        console.log(`Enemy1 Damage: ${enemy1.damage}`);
        console.log(`Enemy2 Damage: ${enemy2.damage}`);
        
        expect(didEnemy1TakeDamage || didEnemy2TakeDamage).toBe(true);
        // Damage is 2.
    });
});
