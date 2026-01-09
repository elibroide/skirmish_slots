
import { GameEngine } from '../../core/GameEngine';
import { UnitCard } from '../../mechanics/cards/Card';

import { PassiveTrait } from '../../mechanics/core/traits/PassiveTrait';
import { PlayerController } from '../../controllers/PlayerController';

// Mock Controller
class MockController implements PlayerController {
    constructor(public playerId: any, public type: 'human' | 'ai') {}
    onEvent(event: any) {}
    onRequestAction(request: any) {}
}

async function runTest() {
  console.log('--- Starting Passive Trait Verification ---');

  // 1. Setup Engine
  const p1 = new MockController(0, 'human');
  const p2 = new MockController(1, 'human');
  
  const engine = new GameEngine(p1, p2, {
    seed: 12345
  });
  
  await engine.initializeGame([], []);

  // 2. Create Test Unit with Passive Buff
  // "BuffSelf": +3 Power
  const unit = new UnitCard('test_passive', 'Passive Unit', 'Passive: +3 Power', 10, 0, engine);
  const passiveTrait = new PassiveTrait(unit, {
      modifiers: [{
          type: 'BuffPower',
          target: { type: 'Self' },
          value: { type: 'static', value: 3 }
      }]
  });
  unit.addTrait(passiveTrait);

  // 3. Deploy (triggers onDeploy -> activate)
  console.log('Deploying unit...');
  await unit.deploy(0 as any); 
  
  // Power should be 10 (base) + 3 (buff) = 13
  // NOTE: Logic update: unit.power getter calls traits if they intercept, OR traits modify state explicitly.
  // BuffPowerModifier calls unit.addPower(3).
  // unit.addPower updates this._buffs.
  // unit.power getter = original + buffs - damage.
  // So it should be 13.

  if (unit.power === 13) {
      console.log('PASS: Passive Buff Applied. Power is 13.');
  } else {
      console.error(`FAIL: Power mismatch. Expected 13, got ${unit.power}`);
      process.exit(1);
  }

  // 4. Test Removal (Detach)
  console.log('Detaching trait...');
  unit.removeTrait(passiveTrait.id);
  
  // removeTrait calls onDetach -> deactivate -> remove modifier -> unit.addPower(-3).
  // Power should be 10.
  
  if ((unit.power as number) === 10) {
      console.log('PASS: Passive Buff Removed. Power is 10.');
  } else {
      console.error(`FAIL: Power mismatch after removal. Expected 10, got ${unit.power}`);
      process.exit(1);
  }
  
  // 5. Test Conditional Passive
  // "Buff +5 if Power < 20" (Always true initially)
  console.log('Testing Conditional Passive...');
  const conditionUnit = new UnitCard('test_cond', 'Cond Unit', 'Buff if < 20', 10, 0, engine);
  const condTrait = new PassiveTrait(conditionUnit, {
      conditions: [{
          target: { type: 'Self' },
          path: 'power',
          condition: 'lt',
          value: { type: 'static', value: 20 }
      }],
      modifiers: [{
          type: 'BuffPower',
          target: { type: 'Self' },
          value: { type: 'static', value: 5 }
      }]
  });
  conditionUnit.addTrait(condTrait);
  await conditionUnit.deploy(0 as any);

  // Should satisfy condition (10 < 20) -> Buff +5 -> 15.
  if ((conditionUnit.power as number) === 15) {
      console.log('PASS: Conditional Buff Applied (10 < 20). Power is 15.');
  } else {
       console.error(`FAIL: Conditional mismatch. Expected 15, got ${conditionUnit.power}`);
       process.exit(1);
  }
  
  // Now simpler test: if we can force condition fail.
  // Manually add power to break threshold?
  // If we add +10 power (via other means), total base becomes 20 (assuming we add to base or just buff).
  // conditionUnit power is 15.
  // If we add +10 buff explicitly: unit.addPower(10). Total buffs = 5 + 10 = 15. Total power = 10 + 15 = 25.
  // Trait onTurnStart check -> Condition: 25 < 20? False.
  // Should deactivate. Buff -5.
  // New buffs = 10. Total power = 20.
  
  console.log('Breaking Condition threshold...');
  await conditionUnit.addPower(10); // Now 25
  
  // Need to trigger re-eval. PassiveTrait hooks into onTurnStart.
  condTrait.onTurnStart(); 
  
  // Expected:
  // Before Check: Power 25.
  // Condition 25 < 20 is False.
  // Deactivate -> remove +5.
  // Result Power: 25 - 5 = 20.
  
  if ((conditionUnit.power as number) === 20) {
       console.log('PASS: Conditional Buff Removed when threshold broken. Power is 20.');
  } else {
       console.error(`FAIL: Conditional logic failed. Expected 20, got ${conditionUnit.power}`);
       process.exit(1);
  }

  console.log('--- Verification Complete: SUCCESS ---');
  process.exit(0);
}

runTest().catch(e => {
    console.error(e);
    process.exit(1);
});
