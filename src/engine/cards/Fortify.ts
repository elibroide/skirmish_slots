import { ActionCard } from './Card';
import type { PlayerId, SlotId, SlotEffect } from '../types';
import type { GameEngine } from '../GameEngine';
import { generateId } from '../../utils/helpers';
import { UnitCard } from './Card';

/**
 * Fortify - Action
 * Give your slot "Deploy: Deal 2 damage to close enemies."
 */
export class Fortify extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('fortify', 'Fortify', owner, engine);
  }

  play(slotId?: unknown): void {
    if (typeof slotId !== 'number' || slotId < 0 || slotId > 3) {
      throw new Error('Fortify requires a valid slot ID');
    }

    const effect: SlotEffect = {
      id: generateId(),
      owner: this.owner,
      description: 'Deploy: Deal 2 damage to close enemies',
      trigger: 'deploy',
      apply: (unit: UnitCard) => {
        if (unit.owner === this.owner) {
          const enemies = unit.getCloseEnemies();
          enemies.forEach((enemy) => enemy.dealDamage(2));
        }
      },
    };

    this.engine.addSlotEffect(slotId as SlotId, effect);
  }
}
