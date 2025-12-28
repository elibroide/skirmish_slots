import { ActionCard } from '../Card';
import { getAdjacentTerrains } from '../../../core/GameState';
export class Seed extends ActionCard {
    constructor(owner, engine) {
        super('seed', 'Seed', 'Give a slot and close slots to it +1.', owner, engine);
    }
    needsTarget() {
        return true;
    }
    getValidTargets(state) {
        // Can target any slot (even empty ones, to hit neighbors)
        const validSlots = [];
        state.terrains.forEach((_, i) => {
            validSlots.push({ terrainId: i, playerId: this.owner });
        });
        return { type: 'slots', validSlots };
    }
    async play(target) {
        // Target slot
        await this.engine.addSlotModifier(target.terrainId, target.playerId, 1);
        // Close slots (adjacent terrains) - Note: getAdjacentTerrains returns number[], need to cast
        const adjacentIds = getAdjacentTerrains(target.terrainId);
        for (const adjId of adjacentIds) {
            // Validate terrain exists before applying (engine handles it now too, but good practice)
            await this.engine.addSlotModifier(adjId, target.playerId, 1);
        }
    }
}
