import { ActionCard } from './Card';
import type { PlayerId } from '../types';
import type { GameEngine } from '../GameEngine';
import { DrawCardEffect } from '../effects/DrawCardEffect';

/**
 * Study the Field - Action
 * Draw 2 cards
 */
export class StudyTheField extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('study_the_field', 'Study the Field', owner, engine);
  }

  play(): void {
    this.engine.enqueueEffect(new DrawCardEffect(this.owner, 2));
  }
}
