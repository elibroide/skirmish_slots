import { ActionCard } from '../Card';
import type { PlayerId, GameState, TargetInfo } from '../../types';
import type { GameEngine } from '../../GameEngine';

export class Strike extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('strike', 'Strike', 'Deal 3 damage to a unit.', owner, engine);
  }

  needsTarget(): boolean {
    return true;
  }

  getValidTargets(state: GameState): TargetInfo {
    // Target any unit
    const validSlots = state.terrains
      .flatMap((t, i) => [
        { terrainId: i, playerId: 0, unit: t.slots[0].unit },
        { terrainId: i, playerId: 1, unit: t.slots[1].unit }
      ])
      .filter(item => item.unit !== null)
      .map(item => ({ terrainId: item.terrainId as any, playerId: item.playerId as any }));

    return { type: 'slots', validSlots };
  }

  async play(targetSlot: any): Promise<void> {
     if (!targetSlot) return;
     const target = this.engine.getUnitAt(targetSlot);
     if (target) {
        await target.dealDamage(3);
     }
  }
}

