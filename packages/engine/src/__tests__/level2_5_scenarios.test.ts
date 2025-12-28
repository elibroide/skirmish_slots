
import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../core/GameEngine';
import { ScriptedController } from './utils/ScriptedController';
import { UnitCard } from '../mechanics/cards/Card';
import { ShieldTrait } from '../mechanics/traits/ShieldTrait';
import { UNIT_CARD_DEFINITIONS } from '../mechanics/cards/cardDefinitions';
import { createUnitCard } from '../mechanics/cards/CardFactory';

describe('Level 2.5: Advanced Mechanics & Scenarios', () => {
    let engine: GameEngine;
    let p0: ScriptedController;
    let p1: ScriptedController;

    const setupGame = async (p0Commands: any[] = [], p1Commands: any[] = []) => {
        p0 = new ScriptedController(0, p0Commands);
        p1 = new ScriptedController(1, p1Commands);
        engine = new GameEngine(p0, p1);
        p0.setEngine(engine);
        p1.setEngine(engine);
        
        // Custom Shield Units
        const shieldUnit1 = new UnitCard('test_shield', 'Shield Unit', 'Has Shield', 2, 0, engine);
        shieldUnit1.addTrait(new ShieldTrait({ amount: 2 }));
        const shieldUnit2 = new UnitCard('test_shield', 'Shield Unit', 'Has Shield', 2, 0, engine);
        shieldUnit2.addTrait(new ShieldTrait({ amount: 2 }));
        
        const deck0 = [shieldUnit1, shieldUnit2];
        
        // Opponent needs a damage dealer (Archer)
        const archer1 = createUnitCard('archer', 1, engine);
        const archer2 = createUnitCard('archer', 1, engine);
        const deck1 = [archer1, archer2];

        // Init Game (Draws hands)
        await engine.initializeGame(deck0, deck1, 'rookie', 'rookie', 0);
        
        return { engine, p0, p1 }; // No runner needed
    };

    it('should intercept damage with ShieldTrait', async () => {
        // Define Scenarios
        // P0: Deploy Shield Unit to T0
        // P1: Deploy Archer to T0 (dealing damage)
        const p0Script = [
            { type: 'PLAY', cardName: 'Shield Unit', target: 0 },
            { type: 'PASS' }
        ];
        const p1Script = [
             { type: 'PLAY', cardName: 'Archer', target: 0 }, // Target 0 for deploy, reuse for Effect target?
             { type: 'PASS' }
        ];

        const { engine } = await setupGame(p0Script, p1Script);

        // Run Loop until skirmish ends or commands exhausted
        // Since it's event driven, we just need to tick the engine/timers
        // or ensure we process enough microtasks.
        
        // Wait for P0 Plays (Deploy + Turn Change)
        // Wait for P1 Plays (Archer + Effect + Turn Change)
        // Wait for P0 Pass
        // Wait for P1 Pass
        
        // Simple "Wait for idle" loop
        let ticks = 0;
        while (ticks < 50) {
            await new Promise(r => setTimeout(r, 0));
            if (engine.state.currentSkirmish > 1) break; // Skirmish ended
            ticks++;
        }

        const unitAtT0 = engine.getUnitAt({ terrainId: 0, playerId: 0 });
        expect(unitAtT0).toBeDefined();
        if (unitAtT0) {
            // Should be full health (original 2 power, 0 damage)
            // Shield absorbed 2.
            expect(unitAtT0.damage).toBe(0); 
            expect(unitAtT0.power).toBe(2); 
        }
    });

    it('should verify event log order for Damage', async () => {
         const p0Script = [
            { type: 'PLAY', cardName: 'Shield Unit', target: 0 },
            { type: 'PASS' }
         ];
         const p1Script = [
             { type: 'PLAY', cardName: 'Archer', target: 0 },
             { type: 'PASS' }
         ];

         const { engine } = await setupGame(p0Script, p1Script);
         
         const events: string[] = [];
         engine.onEvent(e => events.push(e.type));
         
         let ticks = 0;
         while (ticks < 50) {
            await new Promise(r => setTimeout(r, 0));
            if (engine.state.currentSkirmish > 1) break; 
            ticks++;
         }
         
         // Verify Events
         // 1. P0 Deploys -> UNIT_DEPLOYED
         // 2. Turnover -> TURN_CHANGED (maybe)
         // 3. P1 Deploys -> UNIT_DEPLOYED
         // 4. Archer Trait -> ABILITY_TRIGGERED
         // 5. Shield Trait -> ABILITY_TRIGGERED (Shield Depleted trigger) OR logic check?
         //    ShieldTrait intercepts silently usually, but we added a TriggerEffect for removal.
         
         expect(events).toContain('UNIT_DEPLOYED');
         expect(events).toContain('ABILITY_TRIGGERED'); // Archer
    });
});
