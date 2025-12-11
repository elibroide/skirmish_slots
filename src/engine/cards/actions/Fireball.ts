import { ActionCard } from '../Card';
import type { PlayerId, GameState, TargetInfo } from '../../types';
import type { GameEngine } from '../../GameEngine';

export class Fireball extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('fireball', 'Fireball', 'Choose a slot, deal 2 damage to the unit on it and each close unit.', owner, engine);
  }

  needsTarget(): boolean {
    return true;
  }

  getValidTargets(state: GameState): TargetInfo {
    // Can target any slot (even empty ones, to hit neighbors)
    const validSlots: any[] = [];
    state.terrains.forEach((_, i) => {
      validSlots.push({ terrainId: i, playerId: 0 });
      validSlots.push({ terrainId: i, playerId: 1 });
    });
    return { type: 'slots', validSlots };
  }

  async play(targetSlot: any): Promise<void> {
    if (!targetSlot) return;
    
    // Damage unit on slot
    const unit = this.engine.getUnitAt(targetSlot);
    if (unit) await unit.dealDamage(2);
    
    // Damage close units
    const targetTid = targetSlot.terrainId;
    const targetPid = targetSlot.playerId;
    
    // Adjacent terrains
    const adjacentTids = [targetTid - 1, targetTid + 1].filter(t => t >= 0 && t <= 4);
    
    for (const tid of adjacentTids) {
       for (const pid of [0, 1]) {
          const u = this.engine.getUnitAt({ terrainId: tid as any, playerId: pid as any });
          if (u) await u.dealDamage(2);
       }
    }
    
    // Same terrain, opposite slot
    const uInFront = this.engine.getUnitAt({ terrainId: targetTid, playerId: (1 - targetPid) as any });
    if (uInFront) await uInFront.dealDamage(2);
  }
}
