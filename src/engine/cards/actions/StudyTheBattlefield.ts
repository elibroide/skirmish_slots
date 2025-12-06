import { ActionCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';
import { DrawCardEffect } from '../../effects';

/**
 * Study the Battlefield
 * Draw 2 cards
 */
export class StudyTheBattlefield extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('study_the_battlefield', 'Study the Battlefield', 'Draw 2 cards', owner, engine);
  }

  play(): void {
    // Draw 2 cards
    this.engine.enqueueEffect(new DrawCardEffect(this.owner));
    this.engine.enqueueEffect(new DrawCardEffect(this.owner));
  }
}
