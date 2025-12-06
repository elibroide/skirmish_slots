import { ActionCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';
import { DrawCardEffect } from '../../effects';
import { getOpponent } from '../../GameState';

/**
 * Blood Pact
 * You draw 3 cards, opponent draws 1 card
 */
export class BloodPact extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('blood_pact', 'Blood Pact', 'You draw 3 cards, opponent draws 1 card', owner, engine);
  }

  play(): void {
    // Draw 3 cards for self
    this.engine.enqueueEffect(new DrawCardEffect(this.owner));
    this.engine.enqueueEffect(new DrawCardEffect(this.owner));
    this.engine.enqueueEffect(new DrawCardEffect(this.owner));

    // Draw 1 card for opponent
    const opponentId = getOpponent(this.owner);
    this.engine.enqueueEffect(new DrawCardEffect(opponentId));
  }
}
