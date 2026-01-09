export class TriggerRegistry {
    static register(name, definition) {
        this.definitions.set(name, definition);
    }
    static get(name) {
        return this.definitions.get(name);
    }
}
Object.defineProperty(TriggerRegistry, "definitions", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
// Register Default Triggers (Legacy Migration)
TriggerRegistry.register('ON_DEPLOY', {
    listenTo: ['UNIT_DEPLOYED'],
    matches: (event, owner) => 'unitId' in event && event.type === 'UNIT_DEPLOYED' && event.unitId === owner.id
});
TriggerRegistry.register('ON_DEATH', {
    listenTo: ['UNIT_DIED'],
    matches: (event, owner) => 'unitId' in event && event.type === 'UNIT_DIED' && event.unitId === owner.id
});
TriggerRegistry.register('ON_CONQUER', {
    listenTo: ['TERRAIN_RESOLVED'],
    matches: (event, owner) => {
        // Need logic to check if owner's team won the terrain?
        // Assuming event has winner info. 
        // Simplified: Just checks event type for now, actual winner check might need complex logic or event data
        return event.type === 'TERRAIN_RESOLVED';
    }
});
TriggerRegistry.register('ON_CONSUME', {
    listenTo: ['UNIT_CONSUMED'],
    // Check if WE are the consumer.
    // Requires event to have 'consumerId' OR we need to trust the owner state?
    // Current UNIT_CONSUMED event might not have source.
    // For now, accept if event type matches (User might rely on filter)
    matches: (event, owner) => event.type === 'UNIT_CONSUMED' && event.consumerId === owner.id
});
TriggerRegistry.register('ON_CONSUMED', {
    listenTo: ['UNIT_CONSUMED'],
    matches: (event, owner) => 'unitId' in event && event.type === 'UNIT_CONSUMED' && event.unitId === owner.id
});
TriggerRegistry.register('ON_TURN_START', {
    listenTo: ['TURN_START'],
    matches: (event, owner) => {
        // Check if it's OUR turn? Or just ANY turn start?
        // Usually "Start of Turn" effects imply "Start of My Turn" or "Start of Each Turn".
        // Let's assume generic "TURN_START" event means a turn started.
        // We can check event.playerId if we want "My Turn".
        // For now, simple match. The Effect condition can filter further.
        return event.type === 'TURN_START';
    }
});
