import { UnitCard } from './Card';
import type { PlayerId } from '../types';
import type { GameEngine } from '../GameEngine';
import { BounceUnitEffect } from '../effects/BounceUnitEffect';
import { DiscardCardEffect } from '../effects/DiscardCardEffect';

/**
 * Bouncer - Power 2
 * Deploy: Bounce a close unit. If an ally was bounced, discard a card.
 */
export class Bouncer extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('bouncer', 'Bouncer', 2, owner, engine);
  }

  onDeploy(): void {
    const closeUnits = this.engine
      .getCloseUnits(this.slotId, this.owner, 'any')
      .filter((u) => u.id !== this.id); // Can't bounce self

    if (closeUnits.length > 0) {
      // For now, bounce first close unit
      // TODO: Let player choose target
      const target = closeUnits[0];

      this.engine.enqueueEffect(new BounceUnitEffect(target));

      // If bounced ally, discard a card
      if (target.owner === this.owner) {
        this.engine.enqueueEffect(new DiscardCardEffect(this.owner, 1));
      }
    }
  }
}
