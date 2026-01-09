export class EffectRunner {
    constructor(engine, targetResolver, valueResolver, conditionEvaluator // For Sequence or conditional effects if added
    ) {
        Object.defineProperty(this, "engine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: engine
        });
        Object.defineProperty(this, "targetResolver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: targetResolver
        });
        Object.defineProperty(this, "valueResolver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: valueResolver
        });
        Object.defineProperty(this, "conditionEvaluator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: conditionEvaluator
        });
    }
    async run(configs, context, owner) {
        for (const config of configs) {
            await this.executeSingle(config, context, owner);
        }
    }
    async executeSingle(config, context, owner) {
        // 1. Resolve Targets (Who is affected?)
        const targets = this.targetResolver.resolve(config.target, context, owner);
        // 2. Resolve Value (Amount/ID) - if applicable
        let value = 0;
        if (config.value) {
            value = this.valueResolver.resolve(config.value, context, owner);
        }
        // 3. Execute per target (mostly)
        // Check Iteration type for Sequence?
        switch (config.type) {
            case 'Sequence':
                if (config.effects) {
                    if (config.iteration === 'Once') {
                        // Pass full list of targets as 'inheritedTargets'
                        const seqContext = { ...context, inheritedTargets: targets };
                        await this.run(config.effects, seqContext, owner);
                    }
                    else {
                        // ForEach (Default)
                        for (const target of targets) {
                            const seqContext = { ...context, inheritedTargets: [target], unit: target };
                            // unit in context usually refers to "Current Iteree" or "Event Source". 
                            // If iterating, 'unit' is safe to be the target.
                            await this.run(config.effects, seqContext, owner);
                        }
                    }
                }
                break;
            case 'AddPower':
            case 'ADD_POWER': // Support both casing? Doc uses CamelCase strings in examples (AddPower).
                for (const t of targets) {
                    if (t.addPower)
                        await t.addPower(Number(value));
                }
                break;
            case 'DealDamage':
            case 'DEAL_DAMAGE':
                for (const t of targets) {
                    if (t.dealDamage)
                        await t.dealDamage(Number(value));
                }
                break;
            case 'AddArmor':
            case 'ADD_ARMOR': // Armor is usually 'Shield' in code? Doc says AddArmor / AddShield. 
            case 'AddShield':
            case 'ADD_SHIELD':
                for (const t of targets) {
                    if (t.addShield)
                        await t.addShield(Number(value));
                }
                break;
            case 'SetPower':
            case 'SET_POWER':
                for (const t of targets) {
                    if (t.power !== undefined) {
                        const diff = Number(value) - t.power;
                        if (diff !== 0)
                            await t.addPower(diff);
                    }
                }
                break;
            case 'Heal':
            case 'HEAL':
                for (const t of targets) {
                    if (t.heal)
                        await t.heal(Number(value));
                }
                break;
            case 'Kill':
            case 'KILL':
                for (const t of targets) {
                    if (t.die)
                        await t.die('effect_kill');
                }
                break;
            case 'Bounce':
            case 'BOUNCE':
                for (const t of targets) {
                    if (t.bounce)
                        await t.bounce();
                }
                break;
            case 'Cleanse':
            case 'CLEANSE':
                for (const t of targets) {
                    if (t.resetBuffs)
                        await t.resetBuffs();
                    // Also slots?
                    if (t.setModifier) { // It's a slot?
                        if (context.event)
                            context.event.newModifier = 0; // hacky?
                        // Engine needs setModifier on Slot.
                        // SlotCoord doesn't have methods.
                        // Need to look up slot in engine.
                        // TargetResolver returns "normalizedCandidates" which might be Unit or SlotCoord.
                        // If SlotCoord, need engine lookup.
                    }
                    // Check if target is SlotCoord (duck type: terrainId, playerId, no id)
                    if (t.terrainId !== undefined && t.playerId !== undefined && !t.id) {
                        const terrain = this.engine.state.terrains[t.terrainId];
                        const slot = terrain.slots[t.playerId];
                        slot.setModifier(0); // Assuming method exists on Slot object
                    }
                }
                break;
            case 'DrawCards':
            case 'DRAW_CARDS':
                // Targets usually Player? Or Unit Owner?
                // TargetResolver usually returns Units/Slots.
                // If target is Owner (Unit), draw for that player.
                for (const t of targets) {
                    const pid = t.owner !== undefined ? t.owner : t.playerId;
                    if (pid !== undefined) {
                        const player = this.engine.getPlayer(pid);
                        if (player)
                            await player.draw(Number(value));
                    }
                }
                break;
            case 'ModifySlot':
            case 'MODIFY_SLOT': // Value is modifier amount
                for (const t of targets) {
                    // If Unit, find its slot.
                    let slotObj = null;
                    if (t.id) { // Unit
                        if (t.terrainId !== null) {
                            slotObj = this.engine.state.terrains[t.terrainId].slots[t.owner];
                        }
                    }
                    else { // SlotCoord
                        slotObj = this.engine.state.terrains[t.terrainId].slots[t.playerId];
                    }
                    if (slotObj) {
                        slotObj.setModifier(slotObj.modifier + Number(value));
                    }
                }
                break;
            case 'MoveUnit':
            case 'MOVE_UNIT': // target=Who, toSlot=Where
                if (!config.toSlot) {
                    console.warn("MoveUnit missing toSlot");
                    break;
                }
                // Resolve Destination(s)
                // Context for destination resolution?
                // "RelativeToTrigger"?
                const destinations = this.targetResolver.resolve(config.toSlot, context, owner);
                if (targets.length === 0 || destinations.length === 0)
                    break;
                // 1:1 Mapping? Or 1 Unit to 1st Slot?
                // Usually one unit moves.
                const unitToMove = targets[0];
                const destSlot = destinations[0];
                if (!unitToMove.id)
                    break; // Must be unit config
                if (!destSlot.terrainId === undefined)
                    break; // Must be slot
                // Check Swap
                if (config.swap) {
                    // Verify if dest has unit
                    const destUnit = this.engine.getUnitAt(destSlot);
                    if (destUnit) {
                        // Swap Logic
                        // A -> B, B -> A
                        // engine usually has moveUnit(unit, slot).
                        // Need swapUnits(u1, u2) or manual.
                        // Manual: Move A to Temp? No, just set slots.
                        // engine.swapUnits(u1, u2).
                        if (this.engine.swapUnits) {
                            await this.engine.swapUnits(unitToMove, destUnit);
                        }
                        else {
                            console.warn("Engine missing swapUnits");
                        }
                    }
                    else {
                        // Just move
                        await this.engine.moveUnit(unitToMove, destSlot.terrainId);
                    }
                }
                else {
                    // Standard Move (only if empty? or forced?)
                    // Spec doesn't say "Move only if empty".
                    // Engine `moveUnit` usually handles rules.
                    if (this.engine.moveUnit) {
                        await this.engine.moveUnit(unitToMove, destSlot.terrainId);
                    }
                }
                break;
            case 'Fight':
            case 'FIGHT':
                if (!config.opponent)
                    break;
                // Resolve Opponent(s)
                const opponents = this.targetResolver.resolve(config.opponent, context, owner);
                if (opponents.length === 0)
                    break;
                for (const fighter of targets) {
                    // Pick 1st opponent? Or matching index?
                    // Usually 1v1.
                    const opp = opponents[0];
                    if (fighter.id && opp.id) {
                        // Dealing damage logic
                        await opp.dealDamage(fighter.power);
                        if (!opp.isDead()) {
                            await fighter.dealDamage(opp.power);
                        }
                    }
                }
                break;
            case 'DeployUnit':
            case 'DEPLOY_UNIT':
                // Value is Unit ID
                // Target is Slot
                const tokenId = String(value);
                const { createUnitCard } = await import('../../cards/CardFactory'); // Lazy load
                for (const slot of targets) {
                    // Ensure slot
                    if (slot.terrainId !== undefined) {
                        const token = createUnitCard(tokenId, slot.playerId, this.engine);
                        if (this.engine.isDeploymentAllowed(token, slot.terrainId)) {
                            await token.deploy(slot.terrainId);
                        }
                    }
                }
                break;
            default:
                console.warn(`Unknown effect: ${config.type}`);
                break;
        }
    }
}
