import { Leader } from '../Leader';
/**
 * Warlord Leader: Deal 1 damage to an enemy unit
 * Requires selecting a target enemy unit.
 */
export class Warlord extends Leader {
    async execute() {
        const opponentId = this.engine.getOpponent(this.owner);
        const enemyUnits = this.engine.getPlayerUnits(opponentId);
        if (enemyUnits.length === 0) {
            // No valid targets - ability fizzles
            return;
        }
        // Multiple targets - need player input
        const validTargetIds = enemyUnits.map(u => u.id);
        console.log('[Warlord] Requesting input for targets:', validTargetIds);
        const targetId = await this.requestInput({
            type: 'target',
            targetType: 'enemy_unit',
            context: 'Warlord: Choose an enemy unit to deal 1 damage',
            validTargetIds,
        });
        console.log('[Warlord] Received target:', targetId);
        // Find and damage the target
        const target = this.engine.getUnitAt(targetId);
        if (target) {
            await target.dealDamage(1);
        }
    }
    canActivate() {
        // Can only activate if there are enemy units to target
        const opponentId = this.engine.getOpponent(this.owner);
        const enemyUnits = this.engine.getPlayerUnits(opponentId);
        return enemyUnits.length > 0;
    }
}
