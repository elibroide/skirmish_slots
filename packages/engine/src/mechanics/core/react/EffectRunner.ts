import type { UnitCard } from '../../cards/Card';
import type { EffectDefinition, ActionConfig, SelectionConfig, TargetSelector } from './ReactTypes';
import { TargetResolver } from './TargetResolver';
import { ValueResolver } from './ValueResolver';
import { ConditionEvaluator } from './ConditionEvaluator';
import { SelectionResolver } from './SelectionResolver';

export class EffectRunner {
  constructor(
    private engine: any,
    private targetResolver: TargetResolver,
    private valueResolver: ValueResolver,
    private conditionEvaluator: ConditionEvaluator,
    private selectionResolver: SelectionResolver
  ) {}

  public async run(definitions: EffectDefinition[], context: any, owner: UnitCard): Promise<void> {
    console.log(`EffectRunner: Running ${definitions.length} effect definitions.`);
    for (const def of definitions) {
      await this.executeSingle(def, context, owner);
    }
  }

  private async executeSingle(def: EffectDefinition, context: any, owner: UnitCard): Promise<void> {
    // 1. Identify Candidates (WHO)
    let candidates: any[] = [];
    if (def.candidates) {
        candidates = this.targetResolver.resolve(def.candidates, context, owner);
    }
    console.log(`EffectRunner: Resolved ${candidates.length} candidates.`);

    // 2. Selection (HOW)
    // Default to 'All' if strategy not defined
    const selectionConfig: SelectionConfig = def.selection || { strategy: 'All' };
    const targets = await this.selectionResolver.resolve(candidates, selectionConfig, owner);
    console.log(`EffectRunner: Resolved ${targets.length} targets from selection.`);

    if (targets.length === 0) {
        console.log('EffectRunner: No targets. Proceeding to action (valid for Sequence/Global).');
    }

    // 3. Execution (WHAT)
    await this.applyAction(def.action, targets, context, owner);
  }

  private async applyAction(action: ActionConfig, targets: any[], context: any, owner: UnitCard): Promise<void> {
    // Resolve Value if present
    let value: any = 0;
    if (action.value) {
        value = this.valueResolver.resolve(action.value, context, owner);
    }
    
    // Iteration Logic check (e.g. for Sequence or complex actions)
    if (action.iteration === 'ForEach') {
        // Run logic for EACH target individually with fresh context
        for (const target of targets) {
            const iterContext = { ...context, inheritedTargets: [target], unit: target }; 
            await this.applyActionBody(action, [target], value, iterContext, owner);
        }
        return;
    }

    // Default: Apply to all targets at once (or iterate internally)
    await this.applyActionBody(action, targets, value, context, owner);
  }
  
  // The actual effect logic, separated to allow recursion/iteration
  private async applyActionBody(action: ActionConfig, targets: any[], value: any, context: any, owner: UnitCard): Promise<void> {
    console.log(`EffectRunner: Applying action ${action.type} to ${targets.length} targets. Value: ${value}`);
    switch (action.type) {
        case 'Sequence':
            if (action.effects) {
                 // Context is already prepared by applyAction if ForEach was used
                 // Pass inheritedTargets
                 await this.run(action.effects, { ...context, inheritedTargets: targets }, owner);
            }
            break;

        case 'AddPower':
        case 'ADD_POWER': 
            for (const t of targets) {
                if (t.addPower) await t.addPower(Number(value));
            }
            break;

        case 'DealDamage':
        case 'DEAL_DAMAGE':
             for (const t of targets) {
                if (t.dealDamage) await t.dealDamage(Number(value));
            }
            break;

        case 'AddArmor':
        case 'ADD_ARMOR': 
        case 'AddShield':
        case 'ADD_SHIELD':
             for (const t of targets) {
                if (t.addShield) await t.addShield(Number(value));
            }
            break;
            
        case 'SetPower':
        case 'SET_POWER':
             for (const t of targets) {
                 if (t.power !== undefined) {
                     const diff = Number(value) - t.power;
                     if (diff !== 0) await t.addPower(diff);
                 }
             }
             break;

        case 'Heal':
        case 'HEAL':
             for (const t of targets) {
                 if (t.heal) await t.heal(Number(value));
             }
             break;
             
        case 'Kill':
        case 'KILL':
             for (const t of targets) {
                 if (t.die) await t.die('effect_kill');
             }
             break;

        case 'Bounce':
        case 'BOUNCE':
             for (const t of targets) {
                 if (t.bounce) await t.bounce();
             }
             break;
        
        case 'Cleanse':
        case 'CLEANSE':
             for (const t of targets) {
                 if (t.resetBuffs) await t.resetBuffs();
                 if (t.terrainId !== undefined && t.playerId !== undefined && !t.id) {
                     const terrain = this.engine.state.terrains[t.terrainId];
                     const slot = terrain.slots[t.playerId];
                     if (slot.setModifier) slot.setModifier(0);
                 }
             }
             break;

        case 'DrawCards':
        case 'DRAW_CARDS':
             for (const t of targets) {
                 const pid = t.owner !== undefined ? t.owner : t.playerId;
                 if (pid !== undefined) {
                     const player = this.engine.getPlayer(pid);
                     if (player) await player.draw(Number(value));
                 }
             }
             break;

        case 'ModifySlot':
        case 'MODIFY_SLOT': 
              for (const t of targets) {
                  let slotObj = null;
                  if (t.id) { // Unit
                      if (t.terrainId !== null) {
                           slotObj = this.engine.state.terrains[t.terrainId].slots[t.owner];
                      }
                  } else { // SlotCoord
                       slotObj = this.engine.state.terrains[t.terrainId].slots[t.playerId];
                  }

                  if (slotObj && slotObj.setModifier) {
                      slotObj.setModifier(slotObj.modifier + Number(value));
                  }
              }
              break;

        case 'MoveUnit':
        case 'MOVE_UNIT': 
              if (!action.toSlot) {
                  console.warn("MoveUnit missing toSlot");
                  break;
              }
              const destinations = this.targetResolver.resolve(action.toSlot, context, owner);
              
              if (targets.length === 0 || destinations.length === 0) break;

              const unitToMove = targets[0];
              const destSlot = destinations[0];

              if (!unitToMove.id) break; 
              if (destSlot.terrainId === undefined) break; 
              
              if (action.swap) {
                   const destUnit = this.engine.getUnitAt(destSlot);
                   if (destUnit) {
                       if (this.engine.swapUnits) {
                           await this.engine.swapUnits(unitToMove, destUnit);
                       }
                   } else {
                       await this.engine.moveUnit(unitToMove, destSlot.terrainId);
                   }
              } else {
                  if (this.engine.moveUnit) {
                      await this.engine.moveUnit(unitToMove, destSlot.terrainId);
                  }
              }
              break;
              
        case 'Fight':
        case 'FIGHT':
              if (!action.opponent) break;
              
              // Note: If 'opponents' is resolved here, it uses the current context.
              // For "Each ally fights their own enemy", use Sequence with iteration: 'ForEach'.
              const opponents = this.targetResolver.resolve(action.opponent, context, owner);
              if (opponents.length === 0) break;
              
              for (const fighter of targets) {
                   const opp = opponents[0]; // Default: All fighters target the first resolved opponent
                   if (fighter.id && opp.id) {
                        const fighterPower = fighter.power;
                        const oppPower = opp.power;

                        // Simultaneous combat: Both deal damage based on initial power
                        await opp.dealDamage(fighterPower);
                        await fighter.dealDamage(oppPower);
                   }
              }
              break;

        case 'DeployUnit':
        case 'DEPLOY_UNIT':
              const tokenId = String(value);
              const { createUnitCard } = await import('../../cards/CardFactory');
              
              for (const slot of targets) {
                  if (slot.terrainId !== undefined) {
                       const token = createUnitCard(tokenId as any, slot.playerId, this.engine);
                       if (this.engine.isDeploymentAllowed(token, slot.terrainId)) {
                           await token.deploy(slot.terrainId);
                       }
                  }
              }
              break;

        default:
            console.warn(`Unknown effect: ${action.type}`);
            break;
    }
  }
}
