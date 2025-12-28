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
        const event = {
            type: 'ABILITY_TRIGGERED',
            playerId: this.source.owner,
            cardId: this.source.id,
            cardName: this.source.name,
            abilityName: this.name,
        }; // Cast because types aren't updated yet
        // 2. Execute the custom logic
        // This logic might push NEW effects to the stack!
        await this.logic(state);
        return {
            newState: state,
            events: [event]
        };
    }
}
