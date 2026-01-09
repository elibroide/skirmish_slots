export class TriggerManager {
    constructor(engine, owner, targetResolver, onTrigger) {
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
        Object.defineProperty(this, "targetResolver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: targetResolver
        });
        Object.defineProperty(this, "onTrigger", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: onTrigger
        });
        Object.defineProperty(this, "listeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
    }
    register(triggers) {
        triggers.forEach(config => {
            const eventName = this.mapTriggerToEvent(config.type);
            console.log(`Registering trigger ${config.type} -> ${eventName} for ${this.owner.name}`);
            const listener = (event) => {
                if (this.matches(config, event)) {
                    this.onTrigger(config, event);
                }
            };
            this.engine.events.on(eventName, listener);
            this.listeners.push(() => this.engine.events.off(eventName, listener));
        });
    }
    unregister() {
        this.listeners.forEach(off => off());
        this.listeners = [];
    }
    mapTriggerToEvent(triggerType) {
        switch (triggerType) {
            case 'Deploy': return 'UNIT_DEPLOYED';
            case 'Death': return 'UNIT_DIED';
            case 'TurnStart': return 'TURN_START'; // Or specific player turn?
            case 'TurnStarts': return 'TURN_START';
            case 'PlayCard': return 'CARD_PLAYED';
            case 'Consume': return 'UNIT_CONSUMED';
            case 'Activate': return 'ABILITY_TRIGGERED';
            default: return triggerType; // Custom or legacy
        }
    }
    matches(config, event) {
        // 1. Basic Type Match (handled by event subscription, but double check type if shared events)
        // 2. Specific Params
        if (config.type === 'PlayCard' && config.cardType) {
            // Check event.card.type
            // event.card might be CardData or CardInstance
            const cardType = event.card?.type || event.cardType;
            if (cardType !== config.cardType)
                return false;
        }
        // 3. Target Filter ("who triggered the event")
        if (config.target) {
            // Resolve the target selector
            // We need to see if the "Event Source" is in the resolved list.
            // Event Source depends on Event Type.
            const source = this.getEventSource(event);
            if (!source)
                return false;
            // Resolve selector (Relative to OWNER)
            // e.g. "Close Enemy"
            const candidates = this.targetResolver.resolve(config.target, { event }, this.owner);
            // Check if source satisfies candidates
            // Candidates can be Units or Slots.
            const match = candidates.some(cand => {
                if (cand.id && source.id)
                    return cand.id === source.id; // Unit Match
                if (cand.terrainId !== undefined && source.terrainId !== undefined) {
                    return cand.terrainId === source.terrainId && cand.playerId === source.playerId; // Slot Match
                }
                return false;
            });
            if (!match)
                return false;
        }
        return true;
    }
    getEventSource(event) {
        // Resolves the primary actor of the event
        if (event.type === 'UNIT_DEPLOYED' || event.type === 'UNIT_DIED') {
            return this.engine.getUnit(event.unitId);
        }
        if (event.type === 'CARD_PLAYED') {
            return { owner: event.playerId, type: 'PlayerPhantom' }; // Hacky context for player-based checks
        }
        if (event.type === 'ABILITY_TRIGGERED') {
            // If the ability belongs to the card itself, event.cardId should match.
            if (event.cardId) {
                return this.engine.getUnit(event.cardId);
            }
        }
        return null;
    }
}
