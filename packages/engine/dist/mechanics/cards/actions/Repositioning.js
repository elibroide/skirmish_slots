import { ActionCard, UnitCard } from '../Card';
export class Repositioning extends ActionCard {
    constructor(owner, engine) {
        super('repositioning', 'Repositioning', 'Move an ally to a close ally slot. If occupied, swap them.', owner, engine);
    }
    needsTarget() {
        return true;
    }
    getValidTargets(state) {
        // Return all ally units that have at least one adjacent ally slot
        const validSlots = [];
        state.terrains.forEach((terrain, terrainId) => {
            const unit = terrain.slots[this.owner].unit;
            if (unit) {
                // Check if any adjacent slot exists (empty OR occupied by ally)
                const hasAdjacentSlot = this.hasAdjacentSlot(terrainId);
                if (hasAdjacentSlot) {
                    validSlots.push({ terrainId: terrainId, playerId: this.owner });
                }
            }
        });
        return { type: 'slots', validSlots };
    }
    async play(targetSlot) {
        if (!targetSlot)
            return;
        const unit = this.engine.getUnitAt(targetSlot);
        if (!unit)
            return;
        // Get valid destination slots (adjacent ally slots - empty or occupied)
        const destinationSlots = this.getAdjacentSlots(targetSlot.terrainId);
        if (destinationSlots.length === 0)
            return;
        // If only one option, auto-select; otherwise request player input
        let destination;
        if (destinationSlots.length === 1) {
            destination = destinationSlots[0];
        }
        else {
            destination = await this.requestInput({
                type: 'target',
                targetType: 'ally_slot',
                validSlots: destinationSlots,
                context: 'Choose destination slot',
            });
        }
        if (!destination)
            return;
        // Check if destination has a unit (swap) or is empty (move)
        const destUnit = this.engine.getUnitAt(destination);
        if (destUnit) {
            // SWAP: both units exchange positions
            await UnitCard.swap(unit, destUnit);
        }
        else {
            // MOVE: simple relocation
            await unit.move(destination.terrainId);
        }
    }
    hasAdjacentSlot(terrainId) {
        return this.getAdjacentSlots(terrainId).length > 0;
    }
    getAdjacentSlots(fromTerrainId) {
        const slots = [];
        // Check left adjacent
        if (fromTerrainId > 0) {
            slots.push({ terrainId: (fromTerrainId - 1), playerId: this.owner });
        }
        // Check right adjacent
        if (fromTerrainId < 4) {
            slots.push({ terrainId: (fromTerrainId + 1), playerId: this.owner });
        }
        return slots;
    }
}
