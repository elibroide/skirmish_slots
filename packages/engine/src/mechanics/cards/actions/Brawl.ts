import { ActionCard } from '../Card';
import type { PlayerId, GameState, TargetInfo } from '../../../core/types';
import type { GameEngine } from '../../../core/GameEngine';

export class Brawl extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('brawl', 'Brawl', 'An ally fights their opposing enemy.', owner, engine);
  }

  needsTarget(): boolean {
    return true;
  }

  getValidTargets(state: GameState): TargetInfo {
    // Target: Any ally unit that has an opposing enemy
    const opponent = this.engine.getOpponent(this.owner);
    const validSlots = state.terrains
      .map((t, i) => ({
        terrainId: i,
        playerId: this.owner,
        allyUnit: t.slots[this.owner].unit,
        enemyUnit: t.slots[opponent].unit
      }))
      .filter(item => item.allyUnit !== null && item.enemyUnit !== null)
      .map(item => ({ terrainId: item.terrainId as any, playerId: item.playerId }));

    return { type: 'slots', validSlots };
  }

  async play(targetSlot: any): Promise<void> {
    if (!targetSlot) return;

    const ally = this.engine.getUnitAt(targetSlot);
    if (!ally) return;

    const opponent = this.engine.getOpponent(this.owner);
    const enemySlot = { terrainId: targetSlot.terrainId, playerId: opponent };
    const enemy = this.engine.getUnitAt(enemySlot);
    if (!enemy) return;

    // They fight: each deals damage to the other equal to their power
    const allyPower = ally.power;
    const enemyPower = enemy.power;

    // Deal damage simultaneously (capture powers before any damage)
    await ally.dealDamage(enemyPower);
    await enemy.dealDamage(allyPower);
  }
}
