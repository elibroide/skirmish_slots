import { ActionCard } from '../Card';
export class Energize extends ActionCard {
    constructor(owner, engine) {
        super('energize', 'Energize', 'An ally gets +3.', owner, engine);
    }
    needsTarget() {
        return true;
    }
    getValidTargets(state) {
        // Targets: Any ally unit
        const validSlots = state.terrains
            .map((t, i) => ({ terrainId: i, playerId: this.owner, unit: t.slots[this.owner].unit }))
            .filter(item => item.unit !== null)
            .map(item => ({ terrainId: item.terrainId, playerId: item.playerId }));
        return { type: 'slots', validSlots };
    }
    async play(targetSlot) {
        if (!targetSlot)
            return;
        const target = this.engine.getUnitAt(targetSlot);
        if (target) {
            await target.addPower(3);
        }
    }
}
