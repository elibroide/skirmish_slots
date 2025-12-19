import { ActionCard } from '../Card';
import type { PlayerId, GameState, TargetInfo } from '../../types';
import type { GameEngine } from '../../GameEngine';

export class Assassinate extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('assassinate', 'Assassinate', 'Kill an enemy with power 5 or greater.', owner, engine);
  }

  needsTarget(): boolean {
    return true;
  }

  getValidTargets(state: GameState): TargetInfo {
    // Valid targets: Enemy units with power >= 5
    const validUnitIds: string[] = [];
    
    state.terrains.forEach(terrain => {
       const slot = terrain.slots[1 - this.owner as PlayerId]; // Enemy slot
       if (slot.unit && slot.unit.power >= 5) {
         validUnitIds.push(slot.unit.id);
       }
    });

    const validSlots = state.terrains
      .map((t, i) => ({ terrainId: i, playerId: (1 - this.owner) as PlayerId, unit: t.slots[1 - this.owner as PlayerId].unit }))
      .filter(item => item.unit && item.unit.power >= 5)
      .map(item => ({ terrainId: item.terrainId as any, playerId: item.playerId }));

    return { type: 'slots', validSlots };
  }

  async play(targetSlot: any): Promise<void> {
     if (!targetSlot) return;
     const target = this.engine.getUnitAt(targetSlot);
     if (target && target.power >= 5) {
        await target.die('assassinate');
     }
  }
}
