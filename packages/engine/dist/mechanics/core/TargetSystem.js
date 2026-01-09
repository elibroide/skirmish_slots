export class TargetSelector {
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
    }
    getValidTargets(config, context) {
        let slots = [];
        // Handle 'SELF' string shorthand
        if (config.type === 'SELF') {
            slots = this.getZoneTargets('SELF', 'ANY', 'UNIT', undefined, context);
        }
        // Handle Object Query
        else if (typeof config.type === 'object') {
            const q = config.type;
            slots = this.getZoneTargets(q.zone, q.relationship || 'ANY', q.entity || 'UNIT', q.properties, context);
        }
        // Resolve units at those slots (for convenience return)
        const units = slots
            .map(slot => this.engine.getUnitAt(slot))
            .filter(u => !!u);
        return { slots, units };
    }
    getZoneTargets(zone, rel, entityType, properties, context) {
        let candidateSlots = [];
        // 1. Resolve Zone -> Base Slots
        if (zone === 'SELF') {
            if (this.owner.terrainId !== null) {
                candidateSlots.push({ terrainId: this.owner.terrainId, playerId: this.owner.owner });
            }
        }
        else if (zone === 'EVENT') {
            // Contextual resolution
            const unit = context?.victim || context?.unit;
            if (unit && unit.terrainId !== null) {
                candidateSlots.push({ terrainId: unit.terrainId, playerId: unit.owner });
            }
        }
        else if (zone === 'IN_FRONT') {
            if (this.owner.terrainId !== null) {
                const opp = this.engine.getOpponent(this.owner.owner);
                candidateSlots.push({ terrainId: this.owner.terrainId, playerId: opp });
            }
        }
        else if (zone === 'CLOSE') {
            if (this.owner.terrainId !== null) {
                const myTid = this.owner.terrainId;
                const tids = [];
                if (myTid > 0)
                    tids.push(myTid - 1);
                if (myTid < 4)
                    tids.push(myTid + 1);
                // For CLOSE, we check both players on adjacent terrains?
                // Or does Relationship filter that? Relationship filters typically.
                // So for CLOSE we get ALL slots on adjacent terrains.
                for (const t of tids) {
                    candidateSlots.push({ terrainId: t, playerId: this.owner.owner });
                    candidateSlots.push({ terrainId: t, playerId: this.engine.getOpponent(this.owner.owner) });
                }
            }
        }
        else if (zone === 'ALL') {
            for (let i = 0; i < 5; i++) {
                candidateSlots.push({ terrainId: i, playerId: this.owner.owner });
                candidateSlots.push({ terrainId: i, playerId: this.engine.getOpponent(this.owner.owner) });
            }
        }
        // 2. Filter by Relationship
        // (Skip for SELF/EVENT/IN_FRONT? No, IN_FRONT is implicitly Enemy but let's filter anyway)
        // User Request: "SELF... no relationship because self doesn't care about it"
        // So if zone is SELF, we skip relationship check implicitly. 
        if (rel !== 'ANY' && zone !== 'SELF') {
            candidateSlots = candidateSlots.filter(s => {
                const isAlly = s.playerId === this.owner.owner;
                if (rel === 'ALLY' && !isAlly)
                    return false;
                if (rel === 'ENEMY' && isAlly)
                    return false;
                return true;
            });
        }
        // 3. Filter/Reductions (Entities & Properties)
        // If Entity=UNIT, checking properties means checking the UNIT properties.
        // If Entity=SLOT, checking properties means checking SLOT state (e.g. isOpen).
        candidateSlots = candidateSlots.filter(s => {
            const terrain = this.engine.terrains[s.terrainId];
            const unitAtSlot = terrain.slots[s.playerId].unit;
            // Entity Type Check
            if (entityType === 'UNIT' && !unitAtSlot)
                return false; // Must have unit
            // If entityType === 'SLOT', we don't care if unit exists, unless property says so.
            // Property Check
            if (properties) {
                for (const [key, val] of Object.entries(properties)) {
                    if (entityType === 'SLOT') {
                        // Slot Properties
                        if (key === 'isOpen' || key === 'isEmpty') {
                            const isEmpty = !unitAtSlot;
                            if (isEmpty !== val)
                                return false;
                        }
                        // Add slot text properties etc here
                    }
                    else {
                        // Unit Properties
                        if (!unitAtSlot)
                            return false;
                        const u = unitAtSlot;
                        const unitValue = u[key] || u.data?.[key];
                        if (unitValue !== val) {
                            if (Array.isArray(unitValue) && !unitValue.includes(val))
                                return false;
                            if (!Array.isArray(unitValue) && unitValue !== val)
                                return false;
                        }
                    }
                }
            }
            return true;
        });
        return candidateSlots;
    }
}
