import { UnitCard } from '../Card';
import type { PlayerId, GameState, TargetInfo } from '../../types';
import type { GameEngine } from '../../GameEngine';

/**
 * Hunter (4 power)
 * Deploy: Kill a close wounded unit
 */
export class Hunter extends UnitCard {
  private targetUnitId: string | null = null;

  constructor(owner: PlayerId, engine: GameEngine) {
    super('hunter', 'Hunter', 'Deploy: Kill a close wounded unit', 4, owner, engine);
  }

  needsTarget(): boolean {
    // Only needs target if there are wounded enemies
    const woundedEnemies = this.getCloseEnemies().filter(u => u.power < u.originalPower);
    return woundedEnemies.length > 0;
  }

  getValidTargets(state: GameState): TargetInfo {
    // Get all close wounded units
    const closeEnemies = this.getCloseEnemies();
    const woundedEnemies = closeEnemies.filter(u => u.power < u.originalPower);
    return {
      type: 'enemy_unit',
      validUnitIds: woundedEnemies.map(u => u.id),
    };
  }

  selectDefaultTarget(state: GameState): string | null {
    const closeEnemies = this.getCloseEnemies();
    const woundedEnemies = closeEnemies.filter(u => u.power < u.originalPower);
    return woundedEnemies[0]?.id || null;
  }

  async onDeploy(): Promise<void> {
    // Kill target wounded enemy
    if (this.targetUnitId) {
      const target = this.engine.getUnitById(this.targetUnitId);
      if (target && target.power < target.originalPower) {
        target.power = 0; // Kill it
      }
    } else {
      // Auto-select target
      const target = this.selectDefaultTarget(this.engine.state);
      if (target) {
        const unit = this.engine.getUnitById(target);
        if (unit && unit.power < unit.originalPower) {
          unit.power = 0;
        }
      }
    }
  }

  setTarget(targetUnitId: string): void {
    this.targetUnitId = targetUnitId;
  }
}
