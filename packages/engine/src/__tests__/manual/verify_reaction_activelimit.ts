
import { GameEngine } from '../../core/GameEngine';
import { UnitCard } from '../../mechanics/cards/Card';
import { ReactionTrait } from '../../mechanics/core/traits/ReactionTrait';
import { PlayerController } from '../../controllers/PlayerController';

class MockController implements PlayerController {
    constructor(public playerId: any, public type: 'human' | 'ai') {}
    onEvent(event: any) {}
    onRequestAction(request: any) {}
}

async function runTest() {
  console.log('--- Starting Reaction Activate & Limit Verification ---');

  // 1. Setup Engine
  const p1 = new MockController(0, 'human');
  const p2 = new MockController(1, 'human');
  
  const engine = new GameEngine(p1, p2, {
    seed: 12345
  });
  
  // Need to initialize game to setup players/game entity
  await engine.initializeGame([], []);

  // 2. Create Test Unit with Activate Reaction + Limit
  const unit = new UnitCard('test_hacker', 'Test Hacker', 'Ability: Buff Self', 10, 0, engine);
  const reactionTrait = new ReactionTrait(unit, {
    limit: { scope: 'Turn', max: 1 },
    triggers: [{ type: 'Activate' }],
    effects: [{
      type: 'AddPower',
      target: { type: 'Self' },
      value: { type: 'static', value: 5 }
    }]
  });
  unit.addTrait(reactionTrait);

  // 3. Deploy
  console.log('Deploying unit...');
  await unit.deploy(0 as any); // Terrain 0
  
  if (!unit.activateAbility) {
    console.error('FAIL: Unit should have activateAbility object.');
    process.exit(1);
  }
  console.log('PASS: activateAbility initialized.');

  // 4. Activate First Time
  console.log('Activating ability...');
  await unit.activate();
  
  // Check power
  // Force cast to avoid TS error
  if ((unit.power as any) === 15) {
      console.log('PASS: Power increased to 15.');
  } else {
      console.error(`FAIL: Power mismatch. Expected 15, got ${unit.power}`);
      process.exit(1);
  }

  // Check Cooldown/Limit state
  if (unit.activateAbility.cooldownRemaining > 0) {
      console.log('PASS: Cooldown active.');
  } else {
      console.error('FAIL: Cooldown should be active.');
  }

  // 5. Activate Second Time (Should fail due to limit)
  console.log('Activating again (should fail)...');
  await unit.activate();

  if ((unit.power as any) === 15) {
      console.log('PASS: Power remained 15 (Limit worked).');
  } else {
      console.error(`FAIL: Power changed to ${unit.power}. Limit failed.`);
      process.exit(1);
  }

  // 6. Advance Turn
  console.log('Advancing turn (P1 -> P2 -> P1)...');
  // Use submitAction for passing
  await engine.submitAction({ type: 'PASS', playerId: 0 } as any);
  await engine.submitAction({ type: 'PASS', playerId: 1 } as any); 
  // Should be new turn now if both passed? No, pass ends round?
  // Skirmish logic: Turn increases when both pass? Or sequentially?
  // GameEngine logic: "passTurn" doesn't exist. "PASS" action just sets isDone.
  // If both done, round ends.
  
  // To trigger "TurnStart" hooks on unit, we need onTurnStart() to be called.
  // This happens in GameEntity.onTurnStart? Or processed by engine?
  
  // For verify test, we can manually trigger onTurnStart on unit if engine flow is complex to simulate fully without valid game loop.
  // But let's try manual onTurnStart to verify the Limit logic itself (which is inside onTurnStart).
  
  console.log('Simulating Turn Start...');
  unit.onTurnStart(); // This should reset limit if implemented in ReactionTrait

  // Check cooldown
  if (unit.activateAbility.cooldownRemaining === 0) {
       console.log('PASS: Cooldown reset.');
  } else {
       console.error('FAIL: Cooldown did not reset.');
       process.exit(1);
  }

  // 7. Activate Again
  console.log('Activating after turn reset...');
  await unit.activate();

  if ((unit.power as any) === 20) {
      console.log('PASS: Power increased to 20.');
  } else {
      console.error(`FAIL: Power mismatch. Expected 20, got ${unit.power}`);
      process.exit(1);
  }

  console.log('--- Verification Complete: SUCCESS ---');
  process.exit(0);
}

runTest().catch(e => {
    console.error(e);
    process.exit(1);
});
