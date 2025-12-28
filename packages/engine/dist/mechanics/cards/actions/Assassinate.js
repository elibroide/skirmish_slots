import { ActionCard } from '../Card';
export class Assassinate extends ActionCard {
    constructor(owner, engine) {
        super('assassinate', 'Assassinate', 'Kill an enemy with power 5 or greater.', owner, engine);
    }
    needsTarget() {
        return true;
    }
    getValidTargets(state) {
        // Valid targets: Enemy units with power >= 5
        const validUnitIds = [];
        state.terrains.forEach(terrain => {
            const slot = terrain.slots[1 - this.owner]; // Enemy slot
            if (slot.unit && slot.unit.power >= 5) {
                validUnitIds.push(slot.unit.id);
            }
        });
        const validSlots = state.terrains
            .map((t, i) => ({ terrainId: i, playerId: (1 - this.owner), unit: t.slots[1 - this.owner].unit }))
            .filter(item => item.unit && item.unit.power >= 5)
            .map(item => ({ terrainId: item.terrainId, playerId: item.playerId }));
        return { type: 'slots', validSlots };
    }
    async play(targetSlot) {
        if (!targetSlot)
            return;
        const target = this.engine.getUnitAt(targetSlot);
        if (target && target.power >= 5) {
            await target.die('assassinate');
        }
    }
}
