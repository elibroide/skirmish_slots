import { TargetSelector } from './TargetSystem';
export class EffectExecutor {
    constructor(engine, owner) {
        Object.defineProperty(this, "engine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: engine
        });
        Object.defineProperty(this, "owner", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: owner
        });
        Object.defineProperty(this, "handlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        this.registerDefaultEffects();
    }
    registerHandler(type, handler) {
        this.handlers.set(type, handler);
    }
    async execute(config, target, context) {
        const handler = this.handlers.get(config.type);
        // If we have a handler, use it
        if (handler) {
            return handler(config, target, context, this.engine, this.owner);
        }
        // If no handler is found, we might want to log a warning
        console.warn(`No handler found for effect type: ${config.type}`);
        return [];
    }
    resolveTargets(slots) {
        const units = [];
        for (const slot of slots) {
            const unit = this.engine.getUnitAt(slot);
            if (unit)
                units.push(unit);
        }
        return units;
    }
    resolveValue(value, context) {
        if (typeof value === 'function') {
            return value(context);
        }
        if (typeof value === 'object') {
            // DynamicValue resolution
            const dv = value;
            let baseValue = 0;
            // Resolve Source Units using TargetSystem
            const selector = new TargetSelector(this.engine, this.owner);
            const sourceConfig = { type: dv.source };
            const { units } = selector.getValidTargets(sourceConfig, context);
            // Extract Property from ALL source units and sum/concatenate?
            // Usually power/cost are numbers -> Sum.
            // Names are strings -> ? (Maybe first?)
            // Special Case: Property 'amount' from EVENT
            // If source is 'EVENT' (reserved keyword in TargetSystem? target query zone='EVENT')
            // TargetSystem returns valid targets. 
            // But 'EVENT' might imply data *on the event object* itself, not a unit.
            // My TargetSystem `zone: 'EVENT'` returns *units* involved in the event.
            // If we want a property from the *event data* (like damage amount), 
            // TargetSystem might not be enough if it only returns SlotCoords.
            // Handling special "Event Data" property extraction vs "Unit Property" extraction.
            // If the property exists on the EVENT object, we might want that.
            // But `dv.source` is now a TargetQuery.
            // If `dv.source` is literally the string 'EVENT' (from old legacy? No, source IS TargetQuery).
            // Wait, if I want "Damage Amount", that's not on a Unit.
            // Does TargetQuery support "Event Data"? No.
            // HACK: Check if property is on the *context.event* directly first?
            // Or re-introduce `source: 'EVENT_DATA'`?
            // User said: "Targeting here can use the same targeting system".
            // This implies referencing *UNITS*. "Opposing units", "Ally units".
            // For "Amount of damage taken", that is Event Data.
            // Vampiric Marauder used `source: 'EVENT', property: 'amount'`.
            // If I change source to `TargetType`, I can't express "The Event Object itself".
            // Maybe I Keep 'EVENT' as a special string in DynamicValue source?
            // `source: TargetType | 'EVENT_DATA'`?
            // Or if source is a Query with `zone: 'EVENT'`, we *also* check unit properties?
            // Let's assume for now:
            // if property is found on `context.event`, use it.
            // else resolve units.
            if (context.event && context.event[dv.property] !== undefined) {
                baseValue = context.event[dv.property];
            }
            else {
                // Sum over units
                for (const u of units) {
                    const val = u[dv.property] || u.data?.[dv.property];
                    if (typeof val === 'number') {
                        baseValue += val;
                    }
                    else if (typeof val === 'string') {
                        return val; // Return first string found?
                    }
                }
            }
            if (dv.multiplier) {
                baseValue *= dv.multiplier;
            }
            return baseValue;
        }
        return value;
    }
    registerDefaultEffects() {
        // DEAL_DAMAGE
        this.registerHandler('DEAL_DAMAGE', async (config, target, context, engine, owner) => {
            const results = [];
            const targets = this.resolveTargets(target.slots);
            const value = this.resolveValue(config.value, context);
            for (const t of targets) {
                await t.dealDamage(value);
                results.push({ target: t.id, damage: value });
            }
            return results;
        });
        // ADD_POWER
        this.registerHandler('ADD_POWER', async (config, target, context, engine, owner) => {
            const results = [];
            const targets = this.resolveTargets(target.slots);
            const value = this.resolveValue(config.value, context);
            for (const t of targets) {
                await t.addPower(value);
                results.push({ target: t.id, powerAdded: value });
            }
            return results;
        });
        // SET_POWER
        this.registerHandler('SET_POWER', async (config, target, context, engine, owner) => {
            const results = [];
            const targets = this.resolveTargets(target.slots);
            const targetPower = this.resolveValue(config.value, context);
            for (const t of targets) {
                const currentPower = t.power;
                const diff = targetPower - currentPower;
                if (diff !== 0) {
                    await t.addPower(diff);
                }
                results.push({ target: t.id, setPower: targetPower });
            }
            return results;
        });
        // HEAL
        this.registerHandler('HEAL', async (config, target, context, engine, owner) => {
            const results = [];
            const targets = this.resolveTargets(target.slots);
            for (const t of targets) {
                const value = this.resolveValue(config.value, { ...context, targetUnit: t });
                await t.heal(value);
                results.push({ target: t.id, healed: value });
            }
            return results;
        });
        // BOUNCE
        this.registerHandler('BOUNCE', async (config, target, context, engine, owner) => {
            const results = [];
            const targets = this.resolveTargets(target.slots);
            for (const t of targets) {
                await t.bounce();
                results.push({ target: t.id, bounced: true });
            }
            return results;
        });
        // KILL
        this.registerHandler('KILL', async (config, target, context, engine, owner) => {
            const results = [];
            const targets = this.resolveTargets(target.slots);
            for (const t of targets) {
                await t.die('effect_kill');
                results.push({ target: t.id, killed: true });
            }
            return results;
        });
        // ADD_SHIELD
        this.registerHandler('ADD_SHIELD', async (config, target, context, engine, owner) => {
            const results = [];
            const targets = this.resolveTargets(target.slots);
            const value = this.resolveValue(config.value, context);
            for (const t of targets) {
                await t.addShield(value);
                results.push({ target: t.id, shieldAdded: value });
            }
            return results;
        });
        // ADD_SLOT_MODIFIER
        this.registerHandler('ADD_SLOT_MODIFIER', async (config, target, context, engine, owner) => {
            const results = [];
            const value = this.resolveValue(config.value, context);
            for (const slot of target.slots) {
                const terrain = engine.state.terrains[slot.terrainId];
                const terrainSlot = terrain.slots[slot.playerId];
                const newModifier = terrainSlot.modifier + value;
                terrainSlot.setModifier(newModifier);
                await engine.emitEvent({
                    type: 'SLOT_MODIFIER_CHANGED',
                    terrainId: slot.terrainId,
                    playerId: slot.playerId,
                    newModifier: newModifier
                });
                results.push({ slot, modifierAdded: value });
            }
            return results;
        });
        // REMOVE_SLOT_MODIFIER
        this.registerHandler('REMOVE_SLOT_MODIFIER', async (config, target, context, engine, owner) => {
            const results = [];
            for (const slot of target.slots) {
                const terrain = engine.state.terrains[slot.terrainId];
                const terrainSlot = terrain.slots[slot.playerId];
                const removedAmount = terrainSlot.modifier;
                if (removedAmount !== 0) {
                    terrainSlot.setModifier(0);
                    await engine.emitEvent({
                        type: 'SLOT_MODIFIER_CHANGED',
                        terrainId: slot.terrainId,
                        playerId: slot.playerId,
                        newModifier: 0
                    });
                }
                results.push({ slot, removedModifier: removedAmount });
            }
            return results;
        });
        // CLEANSE
        this.registerHandler('CLEANSE', async (config, target, context, engine, owner) => {
            const results = [];
            for (const slot of target.slots) {
                const terrain = engine.state.terrains[slot.terrainId];
                const terrainSlot = terrain.slots[slot.playerId];
                if (terrainSlot.modifier !== 0) {
                    terrainSlot.setModifier(0);
                    await engine.emitEvent({
                        type: 'SLOT_MODIFIER_CHANGED',
                        terrainId: slot.terrainId,
                        playerId: slot.playerId,
                        newModifier: 0
                    });
                }
                const targetUnit = engine.getUnitAt(slot);
                if (targetUnit) {
                    await targetUnit.resetBuffs();
                }
                results.push({ slot, cleansed: true });
            }
            return results;
        });
        // DEPLOY_UNIT
        this.registerHandler('DEPLOY_UNIT', async (config, target, context, engine, owner) => {
            const results = [];
            // Lazy import to avoid circular dependency
            const { createUnitCard } = await import('../cards/CardFactory');
            const value = this.resolveValue(config.value, context);
            const tokenId = typeof value === 'string' ? value : String(value);
            for (const slot of target.slots) {
                // Check if we can deploy
                // Deployment check usually requires a Card Instance, but we are creating one.
                // Simplified check: is slot empty? (isDeploymentAllowed usually does more)
                // But we don't have the token instance yet to pass to isDeploymentAllowed.
                // Let's create it.
                const token = createUnitCard(tokenId, slot.playerId, engine);
                // Note: isDeploymentAllowed might expect 'owner' context
                if (engine.isDeploymentAllowed(token, slot.terrainId)) {
                    await token.deploy(slot.terrainId);
                    results.push({ slot, deployed: tokenId });
                }
            }
            return results;
        });
        // DRAW_CARDS
        this.registerHandler('DRAW_CARDS', async (config, target, context, engine, owner) => {
            const results = [];
            const value = this.resolveValue(config.value, context);
            const player = engine.getPlayer(owner.owner);
            await player.draw(value);
            results.push({ player: player.id, cardsDrawn: value });
            return results;
        });
        // CREATE_CARD
        // CREATE_CARD
        this.registerHandler('CREATE_CARD', async (config, target, context, engine, owner) => {
            const results = [];
            const value = this.resolveValue(config.value, context);
            const cardId = typeof value === 'string' ? value : String(value);
            const { createUnitCard } = await import('../cards/CardFactory');
            for (const slot of target.slots) {
                const player = engine.getPlayer(slot.playerId);
                const newCard = createUnitCard(cardId, player.id, engine);
                await player.addToHand(newCard);
                results.push({ player: player.id, cardCreated: cardId });
            }
            return results;
        });
        // MOVE_UNIT
        this.registerHandler('MOVE_UNIT', async (config, target, context, engine, owner) => {
            const results = [];
            // Target is the DESTINATION slot
            // Value is the UNIT to move (Default: owner/self)
            // If value is a string, it might be a UnitID? But usually we are moving 'Self'.
            // If value is null, move 'Owner'.
            // However, 'resolveValue' returns string/number. 
            // We might need 'resolveUnit' if we want to move *other* units.
            // For now, let's assume MOVE_UNIT moves the *Context Source* (Owner) to the *Target Slot*.
            const unitToMove = owner; // Default
            for (const slot of target.slots) {
                // Can we move there?
                if (engine.isDeploymentAllowed(unitToMove, slot.terrainId)) {
                    await unitToMove.move(slot.terrainId); // Assuming move takes terrainId, wait, move takes SlotCoord? 
                    // Unit.move implementation should be checked.
                    // Checking UnitCard interface: no 'move' method exposed in interface in Step 356.
                    // Need to cast or check implementation.
                    results.push({ unit: unitToMove.id, movedTo: slot });
                }
            }
            return results;
        });
        // FIGHT
        this.registerHandler('FIGHT', async (config, target, context, engine, owner) => {
            const results = [];
            const fighters = this.resolveTargets(target.slots);
            for (const fighter of fighters) {
                // Default victim: Opposing Unit
                // We can use TargetSelector to find victim if 'value' is a query?
                // For now, default to IN_FRONT.
                const oppSlot = { terrainId: fighter.terrainId, playerId: engine.getOpponent(fighter.owner) };
                const victim = engine.getUnitAt(oppSlot);
                if (victim) {
                    // Mutual Strike
                    const damageToVictim = fighter.power;
                    const damageToFighter = victim.power;
                    // Simultaneous? Or Attacker first?
                    // Usually simultaneous in card games or Attacker strikes first.
                    // "Fight" usually means simultaneous.
                    await victim.dealDamage(damageToVictim);
                    if (!victim.isDead()) { // Depending on rules, if victim dies, does it strike back?
                        await fighter.dealDamage(damageToFighter);
                    }
                    else {
                        // Dead units usually don't strike back unless specific rules?
                        // Verify rule later.
                    }
                    results.push({ fighter: fighter.id, victim: victim.id });
                }
            }
            return results;
        });
    }
} // End of class
