import { TriggerRegistry } from '../core/Trigger';
/**
 * Custom Trigger Registration
 * Example: "When a close enemy on a negative slot modifier dies"
 * Usage: In Card/Trait config, use trigger: "CLOSE_ENEMY_NEG_SLOT_DEATH"
 */
export const CUSTOM_TRIGGER_KEYS = {
    CLOSE_ENEMY_NEG_SLOT_DEATH: 'CLOSE_ENEMY_NEG_SLOT_DEATH'
};
TriggerRegistry.register(CUSTOM_TRIGGER_KEYS.CLOSE_ENEMY_NEG_SLOT_DEATH, {
    listenTo: ['UNIT_DIED'],
    matches: (event, owner, context) => {
        // 1. Check Event Type
        if (event.type !== 'UNIT_DIED')
            return false;
        // 2. Resolve Victim
        // In UNIT_DIED, event.unitId is the one who died
        const victimId = event.unitId;
        if (!victimId)
            return false;
        // We need to check if Victim was Close Enemy + Negative Slot
        // Problem: The unit is dead. Is it still in engine to check slots?
        // Usually UNIT_DIED is fired BEFORE cleanup (or during), so unit object exists.
        const victim = owner.engine.getUnit(victimId);
        if (!victim)
            return false;
        // Check Enemy
        if (victim.owner === owner.owner)
            return false; // Not enemy
        // Check Close
        const myTerrain = owner.terrainId;
        const victimTerrain = event.terrainId; // Event usually has location
        if (myTerrain === null || victimTerrain === null)
            return false;
        const diff = Math.abs(myTerrain - victimTerrain);
        if (diff > 1)
            return false; // Not close
        // Check Negative Slot Modifier
        const terrain = owner.engine.terrains[victimTerrain];
        const slot = terrain.slots[victim.owner]; // The slot the victim was on
        if (slot.modifier >= 0)
            return false; // Not negative
        return true;
    }
});
