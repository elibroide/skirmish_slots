import { Trait } from './Trait';
import { TriggerEffect } from '../effects/TriggerEffect';
/**
 * ReactionTrait handles one-time lifecycle triggers
 * Examples: Deploy, Death, Conquer, Consume, Consumed
 */
export class ReactionTrait extends Trait {
    constructor(config, owner) {
        super(`Reaction:${config.trigger}`);
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: config
        });
        if (owner) {
            this.owner = owner;
        }
    }
    async onDeploy() {
        if (this.config.trigger === 'ON_DEPLOY') {
            await this.executeReaction();
        }
    }
    async onDeath() {
        if (this.config.trigger === 'ON_DEATH') {
            await this.executeReaction();
        }
    }
    async onConquer() {
        if (this.config.trigger === 'ON_CONQUER') {
            await this.executeReaction();
        }
    }
    onConsume(victim) {
        if (this.config.trigger === 'ON_CONSUME') {
            const logic = async () => {
                await this.executeReactionWithContext({ victim });
            };
            this.engine.addInterrupt(new TriggerEffect(this.owner, `${this.name}`, logic));
        }
    }
    onConsumed(consumingUnit) {
        if (this.config.trigger === 'ON_CONSUMED') {
            const logic = async () => {
                await this.executeReactionWithContext({ consumingUnit });
            };
            this.engine.addInterrupt(new TriggerEffect(this.owner, `${this.name}`, logic));
        }
    }
    async executeReaction(context) {
        const logic = async () => {
            await this.executeReactionWithContext(context);
        };
        this.engine.addInterrupt(new TriggerEffect(this.owner, `${this.name}`, logic));
    }
    async executeReactionWithContext(context) {
        // Support multiple effects - if effects array is defined, use that
        if (this.config.effects && this.config.effects.length > 0) {
            await this.executeMultipleEffects(context);
            return;
        }
        // Legacy single-effect path
        // Get targets as SlotCoords
        const targetSlots = this.getTargets(context);
        if (targetSlots.length === 0 && this.config.target) {
            return; // No valid targets
        }
        // Apply condition filter if provided (get unit at slot and test condition)
        const filteredSlots = this.config.condition
            ? targetSlots.filter(slot => {
                const unit = this.engine.getUnitAt(slot);
                return unit && this.config.condition(unit);
            })
            : targetSlots;
        if (filteredSlots.length === 0 && this.config.target) {
            return;
        }
        // Determine which targets to affect based on targetDecision
        let selectedSlots = [];
        if (!this.config.target || this.config.target === 'SELF') {
            selectedSlots = filteredSlots;
        }
        else if (this.config.targetDecision === 'ALL') {
            selectedSlots = filteredSlots;
        }
        else if (this.config.targetDecision === 'PLAYER') {
            // Request player input
            if (filteredSlots.length === 0)
                return;
            const targetSlot = await this.owner.requestInput({
                type: 'target',
                targetType: this.getTargetTypeForInput(),
                validSlots: filteredSlots,
                context: `${this.owner.name}: ${this.name}`,
            });
            if (targetSlot) {
                selectedSlots = [targetSlot];
            }
        }
        else if (this.config.targetDecision === 'RANDOM') {
            const randomIndex = Math.floor(this.engine.rng.next() * filteredSlots.length);
            selectedSlots = [filteredSlots[randomIndex]];
        }
        else {
            selectedSlots = [filteredSlots[0]];
        }
        // Apply effect to selected targets
        for (const slot of selectedSlots) {
            await this.applyEffect(slot, context);
        }
    }
    async executeMultipleEffects(context) {
        // Initialize effectResults array in context for effects to reference
        const effectContext = { ...context, effectResults: [], selectedSlot: null };
        for (const effectConfig of this.config.effects) {
            // Get targets for this specific effect
            const targetSlots = this.getTargetsForEffect(effectConfig, effectContext);
            if (targetSlots.length === 0 && effectConfig.target) {
                continue; // No valid targets for this effect
            }
            // Apply condition filter if provided
            const filteredSlots = effectConfig.condition
                ? targetSlots.filter(slot => {
                    const unit = this.engine.getUnitAt(slot);
                    return unit && effectConfig.condition(unit);
                })
                : targetSlots;
            if (filteredSlots.length === 0 && effectConfig.target) {
                continue;
            }
            // Determine which targets to affect
            let selectedSlots = [];
            if (!effectConfig.target || effectConfig.target === 'SELF') {
                selectedSlots = filteredSlots;
            }
            else if (effectConfig.targetDecision === 'ALL') {
                selectedSlots = filteredSlots;
            }
            else if (effectConfig.targetDecision === 'PLAYER') {
                if (filteredSlots.length === 0)
                    continue;
                const targetSlot = await this.owner.requestInput({
                    type: 'target',
                    targetType: this.getTargetTypeForEffectInput(effectConfig),
                    validSlots: filteredSlots,
                    context: `${this.owner.name}: ${this.name}`,
                });
                if (targetSlot) {
                    selectedSlots = [targetSlot];
                    // Store selected slot for subsequent effects to reference
                    effectContext.selectedSlot = targetSlot;
                }
            }
            else if (effectConfig.targetDecision === 'RANDOM') {
                const randomIndex = Math.floor(this.engine.rng.next() * filteredSlots.length);
                selectedSlots = [filteredSlots[randomIndex]];
            }
            else {
                selectedSlots = [filteredSlots[0]];
            }
            // Apply effect to selected targets and collect results
            for (const slot of selectedSlots) {
                const result = await this.applyEffectFromConfig(slot, effectContext, effectConfig);
                effectContext.effectResults.push(result);
            }
        }
    }
    getTargetsForEffect(effectConfig, context) {
        // Use the same targeting logic but with effect-specific config
        if (!effectConfig.target || effectConfig.target === 'SELF') {
            if (this.owner.terrainId === null)
                return [];
            return [{
                    terrainId: this.owner.terrainId,
                    playerId: this.owner.owner
                }];
        }
        // Reuse the existing getTargets logic by temporarily setting config
        const originalTarget = this.config.target;
        this.config.target = effectConfig.target;
        const targets = this.getTargets(context);
        this.config.target = originalTarget;
        return targets;
    }
    getTargetTypeForEffectInput(effectConfig) {
        if (effectConfig.target === 'CLOSE_ENEMY' || effectConfig.target === 'ALL_ENEMIES') {
            return 'enemy_unit';
        }
        if (effectConfig.target === 'CLOSE_ALLY' || effectConfig.target === 'CLOSE_ALLY_SLOT') {
            return 'ally_unit';
        }
        if (effectConfig.target === 'SLOT') {
            return 'slot';
        }
        return 'unit';
    }
    async applyEffectFromConfig(slot, context, effectConfig) {
        const value = typeof effectConfig.value === 'function'
            ? effectConfig.value(context)
            : effectConfig.value;
        const targetUnit = this.engine.getUnitAt(slot);
        switch (effectConfig.effect) {
            case 'DEAL_DAMAGE':
                if (targetUnit) {
                    await targetUnit.dealDamage(value);
                }
                return { type: 'damage', amount: value };
            case 'ADD_POWER':
                if (targetUnit) {
                    await targetUnit.addPower(value);
                }
                return { type: 'power', amount: value };
            case 'SET_POWER':
                if (targetUnit) {
                    const targetPower = value;
                    const currentPower = targetUnit.power;
                    const diff = targetPower - currentPower;
                    if (diff !== 0) {
                        await targetUnit.addPower(diff);
                    }
                }
                return { type: 'setPower', amount: value };
            case 'DRAW_CARDS':
                const player = this.engine.getPlayer(this.owner.owner);
                await player.draw(value);
                return { type: 'draw', amount: value };
            case 'ADD_SLOT_MODIFIER':
                const slotState = this.engine.terrains[slot.terrainId].slots[slot.playerId];
                slotState.setModifier(slotState.modifier + value);
                await this.engine.emitEvent({
                    type: 'SLOT_MODIFIER_CHANGED',
                    terrainId: slot.terrainId,
                    playerId: slot.playerId,
                    newModifier: slotState.modifier
                });
                return { type: 'slotModifier', amount: value };
            case 'REMOVE_SLOT_MODIFIER':
                const slotToRemove = this.engine.terrains[slot.terrainId].slots[slot.playerId];
                const removedAmount = slotToRemove.modifier;
                if (removedAmount !== 0) {
                    slotToRemove.setModifier(0);
                    await this.engine.emitEvent({
                        type: 'SLOT_MODIFIER_CHANGED',
                        terrainId: slot.terrainId,
                        playerId: slot.playerId,
                        newModifier: 0
                    });
                }
                return { type: 'removedSlotModifier', amount: removedAmount, slot };
            case 'KILL':
                if (targetUnit) {
                    await targetUnit.die(`killed by ${this.owner.name}'s ${this.name}`);
                }
                return { type: 'kill' };
            case 'CLEANSE':
                const slotToCleanse = this.engine.terrains[slot.terrainId].slots[slot.playerId];
                if (slotToCleanse.modifier !== 0) {
                    slotToCleanse.setModifier(0);
                    await this.engine.emitEvent({
                        type: 'SLOT_MODIFIER_CHANGED',
                        terrainId: slot.terrainId,
                        playerId: slot.playerId,
                        newModifier: 0
                    });
                }
                if (targetUnit) {
                    const oldPower = targetUnit.power;
                    await targetUnit.resetBuffs();
                    const newPower = targetUnit.power;
                    if (newPower !== oldPower) {
                        await this.engine.emitEvent({
                            type: 'UNIT_POWER_CHANGED',
                            unitId: targetUnit.id,
                            terrainId: slot.terrainId,
                            oldPower,
                            newPower,
                            amount: newPower - oldPower
                        });
                        targetUnit.onPowerChanged(oldPower, newPower);
                    }
                }
                return { type: 'cleanse' };
            case 'DEPLOY_UNIT':
                const { createUnitCard } = await import('../cards/CardFactory');
                const tokenId = typeof effectConfig.value === 'string' ? effectConfig.value : String(value);
                const token = createUnitCard(tokenId, this.owner.owner, this.engine);
                await token.deploy(slot.terrainId);
                return { type: 'deploy', unitId: token.id };
            case 'ADD_SHIELD':
                if (targetUnit) {
                    await targetUnit.addShield(value);
                }
                return { type: 'shield', amount: value };
        }
        return { type: 'unknown' };
    }
    getTargets(context) {
        if (!this.config.target || this.config.target === 'SELF') {
            // Return owner's slot
            if (this.owner.terrainId === null)
                return [];
            return [{
                    terrainId: this.owner.terrainId,
                    playerId: this.owner.owner
                }];
        }
        // Context-based targets (from consumption events)
        if (this.config.target === 'CONSUMING_UNIT') {
            const unit = context?.consumingUnit;
            if (!unit || unit.terrainId === null)
                return [];
            return [{
                    terrainId: unit.terrainId,
                    playerId: unit.owner
                }];
        }
        if (this.config.target === 'CONSUMED_UNIT') {
            const unit = context?.victim;
            if (!unit || unit.terrainId === null)
                return [];
            return [{
                    terrainId: unit.terrainId,
                    playerId: unit.owner
                }];
        }
        if (this.config.target === 'CLOSE_ALLY') {
            return this.unitsToSlotCoords(this.owner.getCloseAllies());
        }
        if (this.config.target === 'CLOSE_ENEMY') {
            return this.unitsToSlotCoords(this.owner.getCloseEnemies());
        }
        if (this.config.target === 'CLOSE_ANY') {
            return this.unitsToSlotCoords([...this.owner.getCloseAllies(), ...this.owner.getCloseEnemies()]);
        }
        if (this.config.target === 'IN_FRONT') {
            const unit = this.owner.getUnitInFront();
            if (!unit || unit.terrainId === null)
                return [];
            return [{
                    terrainId: unit.terrainId,
                    playerId: unit.owner
                }];
        }
        if (this.config.target === 'ALL_ENEMIES') {
            const slots = [];
            const opponent = this.engine.getOpponent(this.owner.owner);
            for (let terrainId = 0; terrainId < 5; terrainId++) {
                const unit = this.engine.terrains[terrainId].slots[opponent].unit;
                if (unit) {
                    slots.push({ terrainId: terrainId, playerId: opponent });
                }
            }
            return slots;
        }
        if (this.config.target === 'SLOT') {
            // Get close slots (for Priest cleanse - all nearby slots)
            const slots = [];
            if (this.owner.terrainId !== null) {
                const myTerrainId = this.owner.terrainId;
                const opponent = this.engine.getOpponent(this.owner.owner);
                // Slot in front
                slots.push({ terrainId: myTerrainId, playerId: opponent });
                // Adjacent terrain slots
                if (myTerrainId > 0) {
                    slots.push({ terrainId: (myTerrainId - 1), playerId: this.owner.owner });
                    slots.push({ terrainId: (myTerrainId - 1), playerId: opponent });
                }
                if (myTerrainId < 4) {
                    slots.push({ terrainId: (myTerrainId + 1), playerId: this.owner.owner });
                    slots.push({ terrainId: (myTerrainId + 1), playerId: opponent });
                }
            }
            return slots;
        }
        if (this.config.target === 'CLOSE_ALLY_SLOT') {
            // Get close ally slots (for Knight - adjacent terrain slots on same side)
            const slots = [];
            if (this.owner.terrainId !== null) {
                const myTerrainId = this.owner.terrainId;
                // Only adjacent terrain slots on owner's side, and must be valid for deployment
                if (myTerrainId > 0) {
                    const leftSlot = { terrainId: (myTerrainId - 1), playerId: this.owner.owner };
                    // Check if deployment would be allowed (will be validated by DeployConditionTrait if needed)
                    slots.push(leftSlot);
                }
                if (myTerrainId < 4) {
                    const rightSlot = { terrainId: (myTerrainId + 1), playerId: this.owner.owner };
                    slots.push(rightSlot);
                }
            }
            return slots;
        }
        return [];
    }
    unitsToSlotCoords(units) {
        return units
            .filter(u => u.terrainId !== null)
            .map(u => ({
            terrainId: u.terrainId,
            playerId: u.owner
        }));
    }
    getTargetTypeForInput() {
        if (this.config.target === 'CLOSE_ENEMY' || this.config.target === 'ALL_ENEMIES') {
            return 'enemy_unit';
        }
        if (this.config.target === 'CLOSE_ALLY') {
            return 'ally_unit';
        }
        return 'unit';
    }
    async applyEffect(slot, context) {
        const value = typeof this.config.value === 'function'
            ? this.config.value(context || { unit: this.owner })
            : this.config.value;
        // Get the unit at the slot (if there is one)
        const targetUnit = this.engine.getUnitAt(slot);
        switch (this.config.effect) {
            case 'DEAL_DAMAGE':
                if (targetUnit) {
                    await targetUnit.dealDamage(value);
                }
                break;
            case 'ADD_POWER':
                if (targetUnit) {
                    await targetUnit.addPower(value);
                }
                break;
            case 'SET_POWER':
                if (targetUnit) {
                    // Set power by calculating the difference from current power
                    const targetPower = value;
                    const currentPower = targetUnit.power;
                    const diff = targetPower - currentPower;
                    if (diff !== 0) {
                        await targetUnit.addPower(diff);
                    }
                }
                break;
            case 'DRAW_CARDS':
                const player = this.engine.getPlayer(this.owner.owner);
                await player.draw(value);
                break;
            case 'ADD_SLOT_MODIFIER':
                const slotState = this.engine.state.terrains[slot.terrainId].slots[slot.playerId];
                slotState.modifier += value;
                await this.engine.emitEvent({
                    type: 'SLOT_MODIFIER_CHANGED',
                    terrainId: slot.terrainId,
                    playerId: slot.playerId,
                    newModifier: slotState.modifier
                });
                break;
            case 'KILL':
                if (targetUnit) {
                    await targetUnit.die(`killed by ${this.owner.name}'s ${this.name}`);
                }
                break;
            case 'CLEANSE':
                // Cleanse a slot: remove slot modifier and unit buffs
                // Use Entities!
                const slotToCleanse = this.engine.terrains[slot.terrainId].slots[slot.playerId];
                // Clear slot modifier (setter handles event)
                if (slotToCleanse.modifier !== 0) {
                    slotToCleanse.setModifier(0);
                }
                if (targetUnit) {
                    // resetBuffs handles logic and events
                    await targetUnit.resetBuffs();
                }
                break;
            case 'DEPLOY_UNIT':
                // Deploy a new unit (token) to a slot
                const { createUnitCard } = await import('../cards/CardFactory');
                const tokenId = typeof this.config.value === 'string' ? this.config.value : String(value);
                const token = createUnitCard(tokenId, this.owner.owner, this.engine);
                await token.deploy(slot.terrainId);
                break;
            case 'ADD_SHIELD':
                if (targetUnit) {
                    await targetUnit.addShield(value);
                }
                break;
        }
    }
}
