export class TargetResolver {
    constructor(engine, conditionEvaluator) {
        Object.defineProperty(this, "engine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: engine
        });
        Object.defineProperty(this, "conditionEvaluator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: conditionEvaluator
        });
    }
    resolve(selector, context, owner) {
        let candidates = []; // Can be UnitCard[] or SlotCoord[]
        // 1. Strategy Resolution
        switch (selector.type) {
            case 'Self':
                candidates = [owner];
                break;
            case 'Relative':
                if (owner.terrainId !== null) {
                    candidates = this.resolveRelative(owner.terrainId, String(owner.owner), selector.proximity, selector.relationship);
                }
                break;
            case 'Inherited':
                candidates = context.inheritedTargets || [];
                if (candidates.length === 0 && context.unit)
                    candidates = [context.unit]; // Fallback?
                break;
            case 'RelativeToTrigger':
                // Find the "Trigger Anchor".
                // Usually context.target or context.unit dependent on event type.
                // E.g. ON_DEATH -> unit is victim.
                // ON_DEPLOY -> unit is deployer.
                const anchor = context.unit || context.target;
                if (anchor && anchor.terrainId !== null) {
                    candidates = this.resolveRelative(anchor.terrainId, anchor.owner, selector.proximity, selector.relationship);
                }
                break;
        }
        // 2. Entity Filtering & Conversion
        // At this point, Relative returns Slots/Units? 
        // My resolveRelative returns Slots.
        // Self returns Unit.
        // Inherited returns Whatever was passed.
        const targetEntity = selector.entity || 'Unit';
        // Normalize to Entity Type
        let normalizedCandidates = [];
        for (const cand of candidates) {
            // Is it a Unit?
            const isUnit = cand.id !== undefined && cand.basePower !== undefined; // Duck typing UnitCard
            // Is it a Slot?
            const isSlot = cand.terrainId !== undefined && cand.playerId !== undefined && !isUnit;
            if (targetEntity === 'Unit') {
                if (isUnit)
                    normalizedCandidates.push(cand);
                else if (isSlot) {
                    const u = this.engine.getUnitAt(cand);
                    if (u)
                        normalizedCandidates.push(u);
                }
            }
            else if (targetEntity === 'Slot') {
                if (isSlot)
                    normalizedCandidates.push(cand);
                else if (isUnit) {
                    // Get slot of unit
                    if (cand.terrainId !== null) {
                        normalizedCandidates.push({ terrainId: cand.terrainId, playerId: cand.owner });
                    }
                }
            }
        }
        // 3. Condition Filtering
        if (selector.condition) {
            normalizedCandidates = normalizedCandidates.filter(target => {
                // For checking condition, we need a context.
                // If checking a Unit, context.unit usually refers to that unit in local scope?
                // ConditionEvaluator evaluateSingle uses 'target' passed to checkTarget.
                // But evaluate(Condition) resolves its own targets?
                // Wait. ConditionEvaluator.evaluate() is "Does this condition pass?".
                // If condition has `target` specified, it checks THAT object.
                // If condition has NO target, it checks implicit context.
                // When filtering list of candidates:
                // "Filter candidates where Candidate.power > 5"
                // The condition in JSON is: { path: 'power', op: 'gt', value: 5 } (No target means Inherited/Self?)
                // To support this, we must pass the candidate as the "Context Target" or "Inherited Target" to ConditionEvaluator.
                // Implementation detail: Pass custom context.
                const filterContext = { ...context, inheritedTargets: [target], unit: target };
                return this.conditionEvaluator.evaluate(selector.condition, filterContext, owner);
            });
        }
        // 4. Selection (Multiple Choice)
        if (selector.multipleChoice && normalizedCandidates.length > 0) {
            switch (selector.multipleChoice) {
                case 'Random':
                    const idx = Math.floor(Math.random() * normalizedCandidates.length); // Use engine RNG if possible
                    normalizedCandidates = [normalizedCandidates[idx]];
                    break;
                case 'Player':
                    // In a synchronous resolution, we can't wait for UI.
                    // Usually this returns all valid options, and the EffectRunner handles the "Ask Player" step.
                    // OR we return all, and let the upstream handle it.
                    // Architecture decision: TargetResolver returns ALL valid options. 
                    // Decision logic happens in EffectRunner or GameAction phase.
                    // Spec says: "Prompt UI for player choice."
                    // For now, return All, mark context "needsSelection"? 
                    // Or just return All.
                    break;
                case 'All':
                default:
                    break;
            }
        }
        return normalizedCandidates;
    }
    // --- Helper: Grid Logic ---
    resolveRelative(originTid, originPid, // 'player' | 'opponent'
    prox = 'Self', rel = 'None') {
        // Return Slots
        let slots = [];
        const opponentPid = this.engine.getOpponent(originPid);
        // 1. Proximity -> Raw Slots
        switch (prox) {
            case 'Self':
                slots.push({ terrainId: originTid, playerId: originPid });
                break;
            case 'Opposing':
                // "Directly across" -> Same lane, opponent side
                slots.push({ terrainId: originTid, playerId: opponentPid });
                break;
            case 'Close':
                // "Left/Right" (Adjacent lanes)
                // Does Close include Self? Usually no.
                // Does Close include Opponent? Usually "Close" means "Adjacent Terrain".
                // Spec says: "Close (Left/Right)"
                // User examples: "Close Enemy" -> Adjacent lane enemies? Or same lane enemy?
                // "Same Lane Enemy" is usually "In Front" or "Opposing".
                // Let's assume Close means Adjacent Lanes (left/right).
                if (originTid > 0) {
                    slots.push({ terrainId: originTid - 1, playerId: originPid });
                    slots.push({ terrainId: originTid - 1, playerId: opponentPid });
                }
                if (originTid < 4) { // Assuming 5 lanes (0-4)
                    slots.push({ terrainId: originTid + 1, playerId: originPid });
                    slots.push({ terrainId: originTid + 1, playerId: opponentPid });
                }
                // Also include same lane?
                // Some interpretations of "Close" include same lane.
                // Given "Opposing" exists, "Close" usually implies strict adjacency or radius.
                // I will stick to Side lanes for now.
                break;
            case 'All':
                for (let i = 0; i < 5; i++) {
                    slots.push({ terrainId: i, playerId: originPid });
                    slots.push({ terrainId: i, playerId: opponentPid });
                }
                break;
        }
        // 2. Relationship Filter
        if (rel !== 'None') {
            slots = slots.filter(s => {
                const isSameTeam = s.playerId === originPid;
                if (rel === 'Ally')
                    return isSameTeam;
                if (rel === 'Enemy')
                    return !isSameTeam;
                return true;
            });
        }
        return slots;
    }
}
