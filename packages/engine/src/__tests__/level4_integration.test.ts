
import { describe, it, expect } from 'vitest';
import { GameEngine } from '../core/GameEngine';
import { ScriptedController } from './utils/ScriptedController';
import { UnitCard } from '../mechanics/cards/Card';
import { createUnitCard } from '../mechanics/cards/CardFactory';

describe('Level 4: Integration & Event Flow', () => {

    it('should verify precise event order for Unit Death sequence', async () => {
        // Setup Controllers with specific scripts
        // Scenario: 
        // 1. P0 deploys Scout (2 HP) to T0. Pass.
        // 2. P1 deploys Archer (Deal 2 Dmg) to T0. (Kills Scout). Pass.
        
        const p0Script: any[] = [
            { type: 'PLAY', cardName: 'Scout', target: 0 },
            { type: 'PASS' }
        ];
        
        const p1Script: any[] = [
            // Deploy to T0, Target P0's unit at T0
            { type: 'PLAY', cardName: 'Archer', target: 0, input: { terrainId: 0, playerId: 0 } },
            { type: 'PASS' }
        ];

        const p0 = new ScriptedController(0, p0Script);
        const p1 = new ScriptedController(1, p1Script);
        const engine = new GameEngine(p0, p1);
        p0.setEngine(engine);
        p1.setEngine(engine);

        // Capture all events
        const eventLog: any[] = [];
        engine.onEvent((e) => {
            eventLog.push({
                type: e.type,
                playerId: 'playerId' in e ? e.playerId : undefined,
                cardName: 'cardName' in e ? e.cardName : undefined,
                unitName: 'unitName' in e ? e.unitName : undefined,
                // Add target/amount info if needed
                amount: 'amount' in e ? e.amount : undefined,
            });
        });

        // Initialize Game (creates cards, etc.)
        // We need explicit decks
        const deck0 = [ createUnitCard('scout', 0, engine), createUnitCard('scout', 0, engine) ];
        const deck1 = [ createUnitCard('archer', 1, engine), createUnitCard('archer', 1, engine) ];
        
        await engine.initializeGame(deck0, deck1, 'rookie', 'rookie', 0);

        // Run until both passed (Skirmish 2 starts or end of Skirmish 1)
        let ticks = 0;
        while (ticks < 100) {
             await new Promise(r => setTimeout(r, 0));
             if (engine.state.currentSkirmish > 1) break;
             ticks++;
        }
        
        // Assertions
        
        // 1. Game Start
        // Events might start with Card Draws during initialization
        const skirmishStartIndex = eventLog.findIndex(e => e.type === 'SKIRMISH_STARTED');
        expect(skirmishStartIndex).not.toBe(-1);
        
        // 2. P0 Deployment (must be after Skirmish Start)
        // Note: exact index might vary if we have 'TURN_STARTED' etc.
        
        const scoutDeployIndex = eventLog.findIndex(e => e.type === 'UNIT_DEPLOYED' && e.unitName === 'Scout');
        expect(scoutDeployIndex).toBeGreaterThan(skirmishStartIndex);
        
        // 3. P1 Turn & Play Archer (must be after Scout)
        const archerDeployIndex = eventLog.findIndex(e => e.type === 'UNIT_DEPLOYED' && e.unitName === 'Archer');
        expect(archerDeployIndex).toBeGreaterThan(scoutDeployIndex);
        
        // 4. Ability Triggered (Archer)
        // Should happen AFTER Archer Deploy (Reaction)
        const elementIndex = eventLog.findIndex((e, i) => i > archerDeployIndex && e.type === 'ABILITY_TRIGGERED');
        expect(elementIndex).not.toBe(-1);
        
        // 5. Damage Dealt to Scout
        const damageIndex = eventLog.findIndex((e, i) => i > elementIndex && e.type === 'UNIT_DAMAGED');
        expect(damageIndex).not.toBe(-1);
        
        // 6. Scout Dies
        // Should happen AFTER Damage (checked by StateChecker)
        const deathIndex = eventLog.findIndex((e, i) => i > damageIndex && e.type === 'UNIT_DIED' && e.unitName === 'Scout');
        expect(deathIndex).not.toBe(-1);
        
        // Log final sequence for inspection (optional)
        // console.log(eventLog);
        
        // Verify Pass Sequence
        const p0Pass = eventLog.findIndex((e, i) => i > deathIndex && e.type === 'PLAYER_PASSED' && e.playerId === 0);
        const p1Pass = eventLog.findIndex((e, i) => i > deathIndex && e.type === 'PLAYER_PASSED' && e.playerId === 1);
        
        expect(p0Pass).not.toBe(-1);
        expect(p1Pass).not.toBe(-1);
    });

});
