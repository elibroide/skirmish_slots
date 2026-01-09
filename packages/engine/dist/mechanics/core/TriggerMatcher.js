export class TriggerMatcher {
    static matches(config, event, owner) {
        // 1. Event Type Match
        if (config.type !== event.type)
            return false;
        // If no filter, we assume it matches if the event type matches?
        // OR do we assume "Global" behavior?
        // User implied: triggers: [{ type: "DEPLOY", filter: "SELF" }]
        // So default filter is probably ANY?
        if (!config.filter)
            return true;
        const { relationship, spatial, properties } = config.filter;
        // 2. Resolve Subject (Who caused the event?)
        let subject;
        if ('unitId' in event) {
            subject = owner.engine.getUnitAt(event.unitId); // Fixed getUnitAt call? No, usually ID lookup is getUnit? 
            // Wait, previous lint said "getUnit" does not exist. 
            // Usually engine.units[id] ? or engine.getUnit(id)?
            // Let's assume getUnitAt is for slots. We need by ID.
            // If engine doesn't expose ID lookup, we might be in trouble.
            // But let's check basic Engine API usage in other files.
            // If Card.ts uses `this.engine...`
            // For now, let's assume we can get it via finding it in terrains (expensive) or if engine has a map.
            // Engine usually has `units` map or similar.
            // Let's rely on event passing specific object references if possible?
            // "unitId" suggests ID.
            // Hack/Fix: Iterate all slots to find unit with ID if no direct lookup.
            // OR checks "context"?
        }
        // Actually, let's look at `TriggerMatcher.ts` previous error.
        // "Property 'getUnit' does not exist on type 'GameEngine'. Did you mean 'getUnitAt'?"
        // getUnitAt takes `SlotCoord`.
        // We probably need to implement `getUnitById` on Engine or do a manual search here.
        // Or assume subject is passed in context if not found?
        // Let's perform a manual search for now to be safe.
        if ('unitId' in event) {
            const uid = event.unitId;
            subject = this.findUnitById(owner.engine, uid);
        }
        if (!subject && (relationship || spatial || properties)) {
        }
    }
    static matches(trigger, event, context) {
        if (trigger.type !== event.type)
            return false;
        if (trigger.filter) {
            const q = trigger.filter;
            const unit = context.sourceUnit; // The unit WITH the trait (SELF)
            const eventUnit = context.eventUnit; // The subject of the event
            if (!unit || !eventUnit)
                return false;
            // Some events might not have units, need care. But most Filtered events imply units.
            // 1. Zone/Spatial Check
            if (q.zone) {
                if (q.zone === 'SELF') {
                    if (eventUnit.id !== unit.id)
                        return false;
                }
                if (q.zone === 'CLOSE') {
                    // Check if eventUnit is close to unit
                    // We can use TargetSelector logic or simple check here?
                    // Ideally reuse logic but TriggerMatcher is static/pure often.
                    // Let's implement simple check.
                    if (unit.terrainId === null || eventUnit.terrainId === null)
                        return false;
                    const diff = Math.abs(unit.terrainId - eventUnit.terrainId);
                    if (diff > 1)
                        return false;
                }
                // IN_FRONT, ALL, etc? 
                // IN_FRONT for trigger: "When unit in front dies"
                if (q.zone === 'IN_FRONT') {
                    if (unit.terrainId === null || eventUnit.terrainId === null)
                        return false;
                    if (unit.terrainId !== eventUnit.terrainId)
                        return false;
                    if (unit.owner === eventUnit.owner)
                        return false; // Must be opposite
                }
            }
            // 2. Relationship Check
            if (q.relationship && q.relationship !== 'ANY') {
                const isAlly = eventUnit.owner === unit.owner;
                if (q.relationship === 'ALLY' && !isAlly)
                    return false;
                if (q.relationship === 'ENEMY' && isAlly)
                    return false;
            }
            // 3. Properties Check
            if (q.properties) {
                for (const [key, val] of Object.entries(q.properties)) {
                    // Check Event Data first? Or Unit properties?
                    // "changeType: 'LOSS'" is in Event Data (event property)
                    // "tags: ['Soldier']" is in Unit property
                    const eventVal = event[key];
                    const unitVal = eventUnit[key] || eventUnit.data?.[key];
                    // Prioritize Event Data for things like 'amount', 'changeType'
                    // Fallback to Unit Data
                    const checkVal = eventVal !== undefined ? eventVal : unitVal;
                    if (checkVal !== val) {
                        if (Array.isArray(checkVal) && !checkVal.includes(val))
                            return false;
                        if (!Array.isArray(checkVal) && checkVal !== val)
                            return false;
                    }
                }
            }
        }
        return true;
    }
    static findUnitById(engine, id) {
        // Naive search
        for (const t of engine.terrains) {
            for (const s of t.slots) {
                if (s.unit && s.unit.id === id)
                    return s.unit;
            }
        }
        return undefined;
    }
}
