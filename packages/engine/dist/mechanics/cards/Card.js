import { PlayerGameEntity } from '../../entities/base/PlayerGameEntity';
/**
 * Base class for all cards
 * Extends GameEntity for common functionality (requestInput, engine access)
 */
export class Card extends PlayerGameEntity {
    constructor(cardId, name, description, owner, engine) {
        super(engine, owner);
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Unique instance ID
        Object.defineProperty(this, "cardId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Card type ID (e.g., "scout")
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Card ability description
        Object.defineProperty(this, "eventUnsubscribers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        // Use engine's seeded RNG for deterministic card IDs
        // Generate a random number between 0 and 999999
        const randomNum = Math.floor(engine.rng.next() * 1000000);
        this.id = `p${owner}_${cardId}_${randomNum}`;
        this.cardId = cardId;
        this.name = name;
        this.description = description;
    }
    /**
     * Does this card need a target to be played?
     */
    needsTarget() {
        return false;
    }
    /**
     * Get valid targets for this card
     */
    getValidTargets(state) {
        // If unit, use engine validation
        if (this.getType() === 'unit') {
            const validSlots = [];
            const terrains = state.terrains;
            terrains.forEach((_, index) => {
                const terrainId = index;
                // Units typically target their own slot
                if (this.engine.isDeploymentAllowed(this, terrainId)) {
                    validSlots.push({ terrainId, playerId: this.owner });
                }
            });
            return {
                type: 'slots',
                validSlots,
            };
        }
        return { type: 'none' };
    }
    /**
     * Select a default target (for AI)
     */
    selectDefaultTarget(state) {
        const targets = this.getValidTargets(state);
        if (targets.type === 'slots' && targets.validSlots.length > 0) {
            return targets.validSlots[0];
        }
        return null;
    }
    // ========== Rule System Helpers ==========
    /**
     * Register a rule modifier
     * @param type Rule type
     * @param modifier Modifier function
     */
    registerRule(type, modifier) {
        this.engine.ruleManager.registerRule(this.id, type, modifier);
    }
    /**
     * Unregister rules for this card
     * @param type Optional specific rule type to remove
     */
    unregisterRule(type) {
        this.engine.ruleManager.unregisterRule(this.id, type);
    }
    // ========== Event System Helpers ==========
    /**
     * Subscribe to a game event. Automatically unsubscribes on leave.
     * @param callback Event listener
     */
    subscribe(callback) {
        const unsubscribe = this.engine.onEvent(callback);
        this.eventUnsubscribers.push(unsubscribe);
    }
    /**
     * Unsubscribe from all registered events
     */
    unsubscribeAll() {
        this.eventUnsubscribers.forEach(unsub => unsub());
        this.eventUnsubscribers = [];
    }
    // ========== Lifecycle Hooks ==========
    /**
     * Override onLeave for base Card cleanup
     */
    onLeave() {
        // Default behavior: Unregister all rules and unsubscribe from events
        this.unregisterRule();
        this.unsubscribeAll();
    }
}
/**
 * Base class for unit cards
 * Now concrete - uses trait system for behavior composition
 */
export class UnitCard extends Card {
    // Accessors for private state
    get damage() { return this._damage; }
    get buffs() { return this._buffs; }
    get shield() { return this._shield; }
    get terrainId() { return this._terrainId; }
    get hasDominant() { return this._hasDominant; }
    get dominantTriggered() { return this._dominantTriggered; }
    // Mutators for specific logic (Internal Use)
    set hasDominant(val) { this._hasDominant = val; } // Needed? Trait usually sets this
    set dominantTriggered(val) { this._dominantTriggered = val; }
    /**
     * Snapshot generation
     */
    toState() {
        return {
            id: this.id,
            cardId: this.cardId,
            name: this.name,
            description: this.description,
            owner: this.owner,
            power: this.power,
            originalPower: this.originalPower,
            damage: this._damage,
            buffs: this._buffs,
            shield: this._shield,
            terrainId: this._terrainId,
            hasDominant: this._hasDominant,
            dominantTriggered: this._dominantTriggered,
            cooldownMax: this.activateAbility?.cooldownMax,
            cooldownRemaining: this.activateAbility?.cooldownRemaining,
            rarity: this.rarity,
            color: this.color,
            unitType: this.unitType
        };
    }
    // Override onLeave to notify traits
    onLeave() {
        // Notify traits that we're leaving the battlefield
        for (const trait of this.traits) {
            trait.onLeave();
        }
        // DON'T call onDetach() or clear the traits array - traits remain attached
        // Call parent cleanup
        super.onLeave();
    }
    constructor(cardId, name, description, power, owner, engine) {
        super(cardId, name, description, owner, engine);
        // power: number; // Removed - using getter
        Object.defineProperty(this, "originalPower", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_damage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "_buffs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "_shield", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "_terrainId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        // Dominant mechanic state
        Object.defineProperty(this, "_hasDominant", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "_dominantTriggered", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        // Traits (ECS Components)
        Object.defineProperty(this, "traits", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        // Metadata
        Object.defineProperty(this, "rarity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Bronze'
        });
        Object.defineProperty(this, "color", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'Red'
        });
        Object.defineProperty(this, "unitType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ''
        });
        // Activate/Cooldown system
        Object.defineProperty(this, "activateAbility", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // this.power = power; // Removed
        this.originalPower = power;
    }
    getType() {
        return 'unit';
    }
    /**
     * Get the current effective power of the unit
     */
    get power() {
        let p = this.originalPower + this._buffs - this._damage;
        // Apply slot modifiers if on board
        if (this._terrainId !== null) {
            const slotModifier = this.engine.getSlotModifier(this._terrainId, this.owner);
            p += slotModifier;
        }
        // Apply trait modifiers
        for (const trait of this.traits) {
            p = trait.modifyPower(p);
        }
        return Math.max(0, p);
    }
    // ========== Core Actions (Direct Async Methods) ==========
    /**
     * Deploy this unit to a terrain.
     * Handles consumption of existing units automatically.
     */
    async deploy(terrainId) {
        const terrain = this.engine.terrains[terrainId];
        const existingUnit = terrain.slots[this.owner].unit;
        let victim = null;
        // 1. Handle Consumption
        if (existingUnit) {
            victim = existingUnit;
            await this.consume(victim);
        }
        // 2. Place Unit
        terrain.slots[this.owner].setUnit(this);
        this._terrainId = terrainId;
        await this.engine.emitEvent({
            type: 'UNIT_DEPLOYED',
            unitId: this.id,
            unitName: this.name,
            terrainId,
            playerId: this.owner,
            entity: this
        });
        // 3. Trigger Lifecycle
        await this.onDeploy();
        // 4. Queue Trigger Resolution (This stays as an Effect/Interrupt because it's a reaction chain)
        if (victim) {
            const { ResolveConsumptionEffect } = await import('../effects/ResolveConsumptionEffect');
            this.engine.addInterrupt(new ResolveConsumptionEffect(victim, this));
        }
    }
    /**
     * Consume another unit (wrapper around death + event).
     */
    async consume(victim) {
        // Victim dies (cause: 'consumed')
        await victim.die('consumed');
        await this.engine.emitEvent({
            type: 'UNIT_CONSUMED',
            unitId: victim.id,
            unitName: victim.name,
            terrainId: victim.terrainId,
        });
    }
    /**
     * Die (remove from board -> graveyard).
     */
    async die(cause = 'death') {
        const terrainId = this.terrainId;
        if (terrainId === null)
            return;
        // 1. Remove from board
        const terrain = this.engine.terrains[terrainId];
        terrain.slots[this.owner].setUnit(null);
        // 2. Add to graveyard
        // 2. Add to graveyard
        const player = this.engine.getPlayer(this.owner);
        player.addToGraveyard(this);
        await this.engine.emitEvent({
            type: 'UNIT_DIED',
            unitId: this.id,
            unitName: this.name,
            terrainId,
            cause,
            entity: this
        });
        // 3. Trigger Death Rattle
        await this.onDeath();
        // 4. Cleanup and clear terrain reference
        this._terrainId = null;
        this.onLeave();
    }
    /**
     * Bounce back to hand.
     */
    async bounce() {
        const terrainId = this.terrainId;
        if (terrainId === null)
            return;
        // 1. Remove from board
        const terrain = this.engine.terrains[terrainId];
        terrain.slots[this.owner].setUnit(null);
        this._terrainId = null;
        // 2. Add to hand
        const player = this.engine.state.players[this.owner];
        player.hand.push(this);
        // 3. Reset State
        this._buffs = 0;
        this._damage = 0;
        this._shield = 0;
        this.dominantTriggered = false; // Reset Dominant trigger on bounce
        await this.engine.emitEvent({
            type: 'UNIT_BOUNCED',
            unitId: this.id,
            unitName: this.name,
            terrainId,
            toHand: true,
            entity: this
        });
        this.onLeave();
    }
    /**
     * Move this unit to a different terrain slot (same player).
     * Does NOT trigger onDeploy - this is a repositioning, not deployment.
     */
    async move(targetTerrainId) {
        const fromTerrainId = this.terrainId;
        if (fromTerrainId === null)
            return;
        if (fromTerrainId === targetTerrainId)
            return; // No-op if same slot
        // 1. Remove from current slot
        const fromTerrain = this.engine.terrains[fromTerrainId];
        fromTerrain.slots[this.owner].setUnit(null);
        // 2. Place in new slot
        const toTerrain = this.engine.terrains[targetTerrainId];
        toTerrain.slots[this.owner].setUnit(this);
        this._terrainId = targetTerrainId;
        // 3. Emit UNIT_MOVED event
        await this.engine.emitEvent({
            type: 'UNIT_MOVED',
            unitId: this.id,
            fromTerrainId,
            toTerrainId: targetTerrainId,
            playerId: this.owner,
            entity: this
        });
        // NOTE: Do NOT call onDeploy() - move is not a deploy
    }
    /**
     * Swap two units' positions (both must belong to same player).
     */
    static async swap(unit1, unit2) {
        if (unit1.owner !== unit2.owner)
            return;
        if (unit1.terrainId === null || unit2.terrainId === null)
            return;
        const terrain1 = unit1.terrainId;
        const terrain2 = unit2.terrainId;
        // Swap terrain references
        const t1 = unit1.engine.terrains[terrain1];
        const t2 = unit1.engine.terrains[terrain2];
        t1.slots[unit1.owner].setUnit(unit2);
        t2.slots[unit2.owner].setUnit(unit1);
        unit1._terrainId = terrain2;
        unit2._terrainId = terrain1;
        // Emit events for both
        await unit1.engine.emitEvent({
            type: 'UNIT_MOVED',
            unitId: unit1.id,
            fromTerrainId: terrain1,
            toTerrainId: terrain2,
            playerId: unit1.owner,
        });
        await unit1.engine.emitEvent({
            type: 'UNIT_MOVED',
            unitId: unit2.id,
            fromTerrainId: terrain2,
            toTerrainId: terrain1,
            playerId: unit2.owner,
        });
        // NOTE: Do NOT call onDeploy() - swap is not a deploy
    }
    // ========== Lifecycle Hooks ==========
    // These are called automatically by effects
    // Now async to support requestInput() calls
    /**
     * Called when this unit is deployed to a terrain
     */
    async onDeploy() {
        // Call trait hooks
        for (const trait of this.traits) {
            await trait.onDeploy();
        }
        // Override in subclasses for additional behavior
    }
    /**
     * Called when this unit dies (any reason)
     */
    async onDeath() {
        // Call trait hooks
        for (const trait of this.traits) {
            await trait.onDeath();
        }
        // Override in subclasses for additional behavior
    }
    /**
     * Called when this unit conquers its terrain
     */
    async onConquer() {
        // Call trait hooks
        for (const trait of this.traits) {
            await trait.onConquer();
        }
        // Override in subclasses for additional behavior
    }
    /**
     * Called when this unit's power changes
     */
    onPowerChanged(_oldPower, _newPower) {
        // Override in subclasses
    }
    /**
     * Called at start of owner's turn (for cooldown reduction and turn-start triggers)
     */
    onTurnStart() {
        // Call trait hooks
        for (const trait of this.traits) {
            trait.onTurnStart();
        }
        // Override in subclasses for additional behavior
    }
    /**
     * Called when this unit is consumed (by another unit or action)
     */
    onConsumed(consumingUnit) {
        // Call trait hooks
        for (const trait of this.traits) {
            trait.onConsumed?.(consumingUnit);
        }
    }
    /**
     * Called when this unit consumes another unit
     */
    onConsume(victim) {
        // Call trait hooks
        for (const trait of this.traits) {
            trait.onConsume?.(victim);
        }
    }
    // ========== Activate/Cooldown Methods ==========
    /**
     * Check if this unit can activate its ability
     */
    canActivate() {
        if (!this.activateAbility)
            return false;
        return this.activateAbility.cooldownRemaining === 0;
    }
    /**
     * Activate this unit's ability
     */
    async activate() {
        if (!this.canActivate())
            return;
        this.activateAbility.activate();
        this.activateAbility.cooldownRemaining = this.activateAbility.cooldownMax;
        await this.engine.emitEvent({
            type: 'ABILITY_ACTIVATED',
            unitId: this.id,
            abilityName: this.activateAbility.description,
        });
    }
    /**
     * Reduce cooldown by 1 (called at start of owner's turn)
     */
    async reduceCooldown() {
        if (!this.activateAbility)
            return;
        if (this.activateAbility.cooldownRemaining > 0) {
            this.activateAbility.cooldownRemaining--;
            await this.engine.emitEvent({
                type: 'COOLDOWN_REDUCED',
                unitId: this.id,
                newCooldown: this.activateAbility.cooldownRemaining,
            });
        }
    }
    // ========== Trait Management ==========
    /**
     * Add a trait to this unit
     */
    addTrait(trait) {
        trait.onAttach(this);
        this.traits.push(trait);
    }
    /**
     * Remove a trait from this unit
     */
    removeTrait(traitId) {
        const index = this.traits.findIndex(t => t.id === traitId);
        if (index !== -1) {
            const trait = this.traits[index];
            trait.onDetach();
            this.traits.splice(index, 1);
        }
    }
    // ========== Helper Methods ==========
    /**
     * Add power to this unit (buff)
     */
    async addPower(amount) {
        const oldPower = this.power;
        this._buffs += amount;
        await this.engine.emitEvent({
            type: 'UNIT_POWER_CHANGED',
            unitId: this.id,
            terrainId: this.terrainId,
            oldPower,
            newPower: this.power,
            amount,
            // Removed duplicate keys
        });
        this.onPowerChanged(oldPower, this.power);
    }
    /**
     * Deal damage to this unit (reduce power)
     * Shield absorbs damage first before health is reduced
     */
    async dealDamage(amount) {
        const oldPower = this.power;
        // Apply trait interceptors (e.g., ShieldTrait for temporary shields)
        let remainingDamage = amount;
        for (const trait of this.traits) {
            remainingDamage = trait.interceptDamage(remainingDamage);
        }
        // Shield absorbs damage before health
        if (this._shield > 0) {
            if (this._shield >= remainingDamage) {
                // Shield absorbs all damage
                this._shield -= remainingDamage;
                remainingDamage = 0;
            }
            else {
                // Shield partially absorbs, overflow goes to health
                remainingDamage -= this._shield;
                this._shield = 0;
            }
        }
        // Apply remaining damage to health
        this._damage += remainingDamage;
        // Cap damage logic is handled in getter (max(0, p))
        await this.engine.emitEvent({
            type: 'UNIT_DAMAGED',
            unitId: this.id,
            terrainId: this.terrainId,
            amount: remainingDamage,
            newPower: this.power,
            // Removed duplicate keys
            entity: this
        });
        this.onPowerChanged(oldPower, this.power);
    }
    /**
     * Heal this unit (restore power up to original)
     * Note: Keep for future use, not used by V2 cards
     */
    async heal(amount) {
        const oldPower = this.power;
        // Healing reduces accumulated damage
        const damageToHeal = Math.min(this._damage, amount);
        this._damage -= damageToHeal;
        if (damageToHeal > 0) {
            await this.engine.emitEvent({
                type: 'UNIT_HEALED',
                unitId: this.id,
                terrainId: this.terrainId,
                amount: damageToHeal,
                newPower: this.power,
                entity: this
                // Removed duplicate keys
            });
            this.onPowerChanged(oldPower, this.power);
        }
    }
    /**
     * Reset buffs (Cleanse effect)
     */
    async resetBuffs() {
        const oldPower = this.power;
        this._buffs = 0;
        const newPower = this.power;
        if (newPower !== oldPower) {
            await this.engine.emitEvent({
                type: 'UNIT_POWER_CHANGED',
                unitId: this.id,
                terrainId: this.terrainId,
                oldPower,
                newPower,
                amount: newPower - oldPower,
                entity: this
            });
            this.onPowerChanged(oldPower, newPower);
        }
    }
    /**
     * Add shield to this unit
     * Shield absorbs damage before health is reduced
     */
    async addShield(amount) {
        this._shield += amount;
    }
    /**
     * Get close ally units (adjacent terrains)
     */
    getCloseAllies() {
        return this.engine.getCloseUnits(this.terrainId, this.owner, 'ally');
    }
    /**
     * Get close enemy units (adjacent terrains)
     */
    getCloseEnemies() {
        return this.engine.getCloseUnits(this.terrainId, this.owner, 'enemy');
    }
    /**
     * Get unit in front (opposite player's unit on same terrain)
     */
    getUnitInFront() {
        if (this.terrainId === null)
            return null;
        return this.engine.getUnitInFront(this.terrainId, this.owner);
    }
    /**
     * Check if this unit can be consumed
     * NOTE: This check doesn't include context (who is consuming), so it's a basic check.
     * Full validation happens in GameEngine using RuleManager.
     */
    canBeConsumed() {
        return true;
    }
}
/**
 * Base class for action cards
 */
export class ActionCard extends Card {
    getType() {
        return 'action';
    }
}
