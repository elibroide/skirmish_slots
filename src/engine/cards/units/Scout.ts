import { UnitCard } from '../Card';
import type { PlayerId } from '../../types';
import type { GameEngine } from '../../GameEngine';
import { DrawCardEffect } from '../../effects';

/**
 * Scout (2 power)
 * Deploy: Draw a card
 */
export class Scout extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('scout', 'Scout', 'Deploy: Draw a card', 2, owner, engine);
  }

  async onDeploy(): Promise<void> {
    // Draw a card when deployed
    this.engine.enqueueEffect(new DrawCardEffect(this.owner));
  }
}
