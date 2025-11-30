import { UnitCard } from './Card';
import type { PlayerId } from '../types';
import type { GameEngine } from '../GameEngine';
import { DrawCardEffect } from '../effects/DrawCardEffect';

/**
 * Scout - Power 1
 * Deploy: Draw 1 card
 */
export class Scout extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('scout', 'Scout', 1, owner, engine);
  }

  onDeploy(): void {
    this.engine.enqueueEffect(new DrawCardEffect(this.owner, 1));
  }
}
