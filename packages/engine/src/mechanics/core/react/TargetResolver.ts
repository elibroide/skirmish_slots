import type { UnitCard } from '../../cards/Card';
import type { SlotCoord } from '../../../systems/rules/RuleTypes';
// import type { TargetSelector } from '../../core/types'; // Using ReactTypes instead
// Actually SlotCoord is in '../../systems/rules/RuleTypes' or types.
// I will just use 'any' for engine to avoid deep coupling, but import SlotCoord for typing.
import type { TargetSelector as Selector, ProximityType, RelationType, EntityType, SelectionType } from './ReactTypes';
import { ConditionEvaluator } from './ConditionEvaluator';

export class TargetResolver {
  constructor(
    private engine: any,
    private conditionEvaluator: ConditionEvaluator
  ) {}

  public resolve(selector: Selector, context: any, owner: UnitCard): any[] {
    let candidates: any[] = []; // Can be UnitCard[] or SlotCoord[]

    // 1. Strategy Resolution
    switch (selector.type) {
      case 'Self':
        candidates = [owner];
        break;
      
      case 'Relative':
      // Use iteration unit (from ForEach) or owner
      const relSource = context.unit || owner;
      if (relSource.terrainId !== null) {
         candidates = this.resolveRelative(
           relSource.terrainId, 
           String(relSource.owner), 
           selector.proximity, 
           selector.relationship
         );
      }
      break;



      case 'RelativeToIteration':
        // The unit currently being processed in an iteration (ForEach)
        if (context.unit) {
            candidates = [context.unit];
        }
        break;

      case 'RelativeToTrigger':
        // Find the "Trigger Anchor".
        // Usually context.target or context.unit dependent on event type.
        // E.g. ON_DEATH -> unit is victim.
        // ON_DEPLOY -> unit is deployer.
        const anchor = context.unit || context.target; 
        if (anchor && anchor.terrainId !== null) {
            candidates = this.resolveRelative(
                anchor.terrainId,
                anchor.owner,
                selector.proximity,
                selector.relationship
            );
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
    let normalizedCandidates: any[] = [];

    for (const cand of candidates) {
        // Is it a Unit?
        const isUnit = cand.id !== undefined && (cand.originalPower !== undefined || cand.power !== undefined); // Duck typing UnitCard
        // Is it a Slot?
        const isSlot = cand.terrainId !== undefined && cand.playerId !== undefined && !isUnit;

        if (targetEntity === 'Unit') {
             if (isUnit) normalizedCandidates.push(cand);
             else if (isSlot) {
                 const u = this.engine.getUnitAt(cand);
                 if (u) {
                     normalizedCandidates.push(u);
                  } else if (context?.event?.type === 'UNIT_DIED' || context?.event?.type === 'UNIT_CONSUMED') {
                     // Check if dead unit was here using Snapshot
                     const evt = context.event;
                     // Safe null check for unitState
                     if (evt.unitState) {
                         const state = evt.unitState;
                         // Check match using snapshot data
                         if (state.terrainId === cand.terrainId && String(state.owner) === String(cand.playerId)) {
                              // Wrap snapshot in a proxy or just use it?
                              // If we push the snapshot, downstream consumers (ValueResolver, ConditionEvaluator) must handle UnitState objects.
                              // UnitState has same shape as UnitCard for data interactions.
                              normalizedCandidates.push(state);
                         }
                     } else {
                         // Fallback for legacy/missing snapshot (should not happen with new Card.ts)
                         if (evt.terrainId === cand.terrainId && String(evt.playerId) === String(cand.playerId)) {
                             if (evt.entity) normalizedCandidates.push(evt.entity);
                         }
                     }
                  }
             }
        } else if (targetEntity === 'Slot') {
            if (isSlot) normalizedCandidates.push(cand);
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
            return this.conditionEvaluator.evaluate(selector.condition!, filterContext, owner);
        });
    }

    // 4. Selection (Multiple Choice) - HANDLED BY REACTIONTRAIT/EFFECTRUNNER via SelectionConfig
    // TargetResolver returns ALL valid candidates.

    return normalizedCandidates;
  }

  // --- Helper: Grid Logic ---
  
  private resolveRelative(
      originTid: number, 
      originPid: string, // 'player' | 'opponent'
      prox: ProximityType = 'Self', 
      rel: RelationType = 'None'
  ): any[] {
      // Return Slots
      let slots: any[] = [];
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
              if (rel === 'Ally') return isSameTeam;
              if (rel === 'Enemy') return !isSameTeam;
              return true;
          });
      }

      return slots;
  }
}
