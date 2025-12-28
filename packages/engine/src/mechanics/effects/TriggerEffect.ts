import { Effect } from './Effect';
import type { EffectResult, GameState, GameEvent } from '../../core/types';
import type { Card } from '../cards/Card';

export class TriggerEffect extends Effect {
  constructor(
    private source: Card,
    private name: string,
    private logic: (state: GameState) => Promise<void>
  ) {
    super();
  }

  async execute(state: GameState): Promise<EffectResult> {
    // 1. Announce the trigger (UI can show this)
    // 1. Announce the trigger Immediately (so it appears before any consequences like Damage/Death)
    const event: GameEvent = {
      type: 'ABILITY_TRIGGERED',
      playerId: this.source.owner,
      cardId: this.source.id,
      cardName: this.source.name,
      abilityName: this.name,
    } as unknown as GameEvent;

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

