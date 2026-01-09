import { Effect } from './Effect';
export class TriggerEffect extends Effect {
    constructor(source, name, logic) {
        super();
        Object.defineProperty(this, "source", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: source
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: name
        });
        Object.defineProperty(this, "logic", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: logic
        });
    }
    async execute(state) {
        // 1. Announce the trigger (UI can show this)
        // 1. Announce the trigger Immediately (so it appears before any consequences like Damage/Death)
        const event = {
            type: 'ABILITY_TRIGGERED',
            playerId: this.source.owner,
            cardId: this.source.id,
            cardName: this.source.name,
            abilityName: this.name,
        };
        // Use engine safely (trait might not set engine on Effect? addInterrupt does setEngine)
        if (this.engine) {
            await this.engine.emitEvent(event);
        }
        // 2. Execute the custom logic
        // This logic might push NEW effects to the stack!
        await this.logic(state);
        return {
            newState: state,
            events: [] // Event already emitted
        };
    }
}
