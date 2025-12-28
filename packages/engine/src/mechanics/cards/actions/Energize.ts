import { ActionCard } from '../Card';
import type { PlayerId, GameState, TargetInfo } from '../../../core/types';
import type { GameEngine } from '../../../core/GameEngine';

export class Energize extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('energize', 'Energize', 'An ally gets +3.', owner, engine);
  }

  needsTarget(): boolean {
    return true;
  }

  getValidTargets(state: GameState): TargetInfo {
    // Targets: Any ally unit
    const validSlots = state.terrains
      .map((t, i) => ({ terrainId: i, playerId: this.owner, unit: t.slots[this.owner].unit }))
      .filter(item => item.unit !== null)
      .map(item => ({ terrainId: item.terrainId as any, playerId: item.playerId }));

    return { type: 'slots', validSlots };
  }

  async play(targetSlot: any): Promise<void> {
     if (!targetSlot) return;
     const target = this.engine.getUnitAt(targetSlot);
     if (target) {
        await target.addPower(3);
     }
  }
}

