import { ActionCard } from '../Card';
export class Unsummon extends ActionCard {
    constructor(owner, engine) {
        super('unsummon', 'Unsummon', 'Return a unit to hand.', owner, engine);
    }
    needsTarget() {
        return true;
    }
    getValidTargets(state) {
        // Target any unit (ally or enemy?) Usually any.
        const validSlots = state.terrains
            .flatMap((t, i) => [
            { terrainId: i, playerId: 0, unit: t.slots[0].unit },
            { terrainId: i, playerId: 1, unit: t.slots[1].unit }
        ])
            .filter(item => item.unit !== null)
            .map(item => ({ terrainId: item.terrainId, playerId: item.playerId }));
        return { type: 'slots', validSlots };
    }
    async play(targetSlot) {
        if (!targetSlot)
            return;
        const target = this.engine.getUnitAt(targetSlot);
        if (target) {
            await target.bounce();
        }
    }
}
