import { ActionCard } from '../Card';
export class Fireball extends ActionCard {
    constructor(owner, engine) {
        super('fireball', 'Fireball', 'Choose a slot, deal 2 damage to the unit on it and each close unit.', owner, engine);
    }
    needsTarget() {
        return true;
    }
    getValidTargets(state) {
        // Can target any slot (even empty ones, to hit neighbors)
        const validSlots = [];
        state.terrains.forEach((_, i) => {
            validSlots.push({ terrainId: i, playerId: 0 });
            validSlots.push({ terrainId: i, playerId: 1 });
        });
        return { type: 'slots', validSlots };
    }
    async play(targetSlot) {
        if (!targetSlot)
            return;
        // Damage unit on slot
        const unit = this.engine.getUnitAt(targetSlot);
        if (unit)
            await unit.dealDamage(2);
        // Damage close units
        const targetTid = targetSlot.terrainId;
        const targetPid = targetSlot.playerId;
        // Adjacent terrains
        const adjacentTids = [targetTid - 1, targetTid + 1].filter(t => t >= 0 && t <= 4);
        for (const tid of adjacentTids) {
            for (const pid of [0, 1]) {
                const u = this.engine.getUnitAt({ terrainId: tid, playerId: pid });
                if (u)
                    await u.dealDamage(2);
            }
        }
        // Same terrain, opposite slot
        const uInFront = this.engine.getUnitAt({ terrainId: targetTid, playerId: (1 - targetPid) });
        if (uInFront)
            await uInFront.dealDamage(2);
    }
}
