
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

async function runTest() {
  console.log('--- Starting Async Selection Verification ---');

  // 1. Setup Engine
  const p1 = new MockController(0, 'human');
  const p2 = new MockController(1, 'human');
  const engine = new GameEngine(p1, p2, { seed: 12345 });
  await engine.initializeGame([], []);

  // 2. Setup Board
  // Player 0: "Hero" (Owner of reaction)
  const hero = new UnitCard('hero', 'Hero', 'Deals Logic', 10, 0, engine);
  await hero.deploy(0 as any); // Slot 0,0

  // Player 1: Two "Enemies"
  const enemy1 = new UnitCard('e1', 'Enemy 1', '-', 10, 0, engine);
  const enemy2 = new UnitCard('e2', 'Enemy 2', '-', 10, 0, engine);
  await enemy1.deploy(1 as any); // Slot 0,1 (Opposing)
  await enemy2.deploy(1 as any); 
  // Wait, deploy takes terrainId. '1' is terrain 1? 
  // Use explicit terrain placement.
  // Hero at T0 (P0 side).
  // Enemy1 at T0 (P1 side) -> Opposing.
  // Enemy2 at T1 (P1 side) -> Close?
  
  // Let's force placement to ensure TargetResolver finds both.
  // T0, P0: Hero
  // T0, P1: Enemy1
  // T1, P1: Enemy2
  // If target is "Relative", "All", "Enemy".
  // TargetResolver.resolveRelative(..., 'All', 'Enemy').
  // Should return both E1 and E2.
  
  // We need to manually move them because deploy() rules might be strict.
  // Just verify unit positions.
  // engine.state.terrains[0].slots[0].unit = hero;
  // engine.state.terrains[0].slots[1].unit = enemy1;
  // engine.state.terrains[1].slots[1].unit = enemy2;
  // hero.terrainId = 0; enemy1.terrainId = 0; enemy2.terrainId = 1;

  // 3. Setup Reaction
  const reactionTrait = new ReactionTrait(hero, {
      triggers: [{ type: 'ManualTest' }],
      effects: [{
          type: 'BuffPower', // Simple effect
          target: { 
              type: 'Relative', 
              proximity: 'All', 
              relationship: 'Enemy',
              multipleChoice: 'Player' // <--- KEY
          },
          value: { type: 'static', value: -5 } // Debuff
      }]
  });
  hero.addTrait(reactionTrait);

  // 4. Mock Input Request
  let selectionRequested = false;
  hero.requestInput = async (req: any) => {
      console.log('MOCK: requestInput called with', req.type);
      selectionRequested = true;
      if (req.type === 'select_target') {
          console.log(`MOCK: Candidates found: ${req.candidates.length}`);
          // Select Enemy 2 (Index 1 assuming logical order, or by ID)
          const target = req.candidates.find((c: any) => c.id === 'e2');
          return [target];
      }
      return [];
  };

  // 5. Trigger Reaction
  // We use TriggerManager usually, but here we can call handleTrigger via private access hack or just Simulate Event?
  // Let's us simulate via emitEvent if TriggerManager was hooked up?
  // Manual trigger via handleTrigger is easier for unit test.
  // reactionTrait['handleTrigger']({ type: 'ManualTest' }, {});
  
  // TriggerManager listens to events.
  // We registered 'ManualTest' trigger.
  // So emitting event 'ManualTest' should work IF TriggerManager supports custom string triggers.
  // ReactTypes: TriggerType = ... | string. Yes. triggerMatcher matches type.
  
  console.log('Emitting ManualTest event...');
  
  // Using engine to emit event, which TriggerManager hears.
  // TriggerManager checks: event.type === 'ManualTest'.
  // We need to assert context. 
  // TriggerMatcher usually filters by cardType or ID?
  // If no filters in TriggerConfig, it matches ANY 'ManualTest' event?
  // TriggerManager listens to ALL events? Yes.
  
  // But wait, the async stack means we need to process the stack.
  // engine.emitEvent -> triggerManager -> handleTrigger -> creates TriggerEffect -> engine.addInterrupt.
  // processEffectStack() needs to run.
  
  await engine.emitEvent({ type: 'ManualTest', playerId: 0 } as any);
  
  // At this point, the TriggerEffect should be in the stack (or processing if we didn't await processEffectStack?).
  // engine.emitEvent usually awaits processEffectStack() at the end?
  // In GameEngine.ts: emitEvent() pushes to event history, notifies listeners.
  // Listeners (TriggerManager) run synchronous?
  // TriggerManager.onEvent calls handleTrigger.
  // handleTrigger calls engine.addInterrupt().
  // addInterrupt adds to stack.
  // Does emitEvent trigger stack processing?
  // engine.ts: emitEvent does NOT call processEffectStack. 
  // processEffectStack is called in game loop (passTurn) or manually?
  // Wait, TriggerEffect logic says: "This logic might push NEW effects to the stack!".
  // If we rely on stack, we must ensure stack runs.
  // We can call engine['processEffectStack']();
  
  console.log('Processing Effect Stack...');
  await engine['processEffectStack']();

  // 6. Verification
  if (!selectionRequested) {
      console.error('FAIL: requestInput was NOT called.');
      process.exit(1);
  } else {
      console.log('PASS: requestInput was called.');
  }

  // Check results
  // Enemy 1 should be untouched (10)
  // Enemy 2 should be debuffed (5)
  
  if (enemy1.power === 10) {
      console.log('PASS: Enemy 1 power is 10 (Ignored)');
  } else {
      console.error('FAIL: Enemy 1 power is ' + enemy1.power);
  }

  if (enemy2.power === 5) {
      console.log('PASS: Enemy 2 power is 5 (Selected)');
  } else {
      console.error('FAIL: Enemy 2 power is ' + enemy2.power);
  }
}

runTest().catch(console.error);
