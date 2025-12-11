import { Effect } from './Effect';
import type { EffectResult, GameState, GameEvent } from '../types';
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
    const event: GameEvent = {
      type: 'ABILITY_TRIGGERED',
      playerId: this.source.owner,
      cardId: this.source.id,
      cardName: this.source.name,
      abilityName: this.name,
    } as unknown as GameEvent; // Cast because types aren't updated yet

    // 2. Execute the custom logic
    // This logic might push NEW effects to the stack!
    await this.logic(state);

    return { 
      newState: state, 
      events: [event] 
    };
  }
}

