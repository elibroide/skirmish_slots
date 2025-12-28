import { GameState, PlayerId, TerrainId } from '@skirmish/engine';

/**
 * Creates a clean, UI-safe copy of the engine state.
 * Removes circular dependencies (like 'engine' references in Player/Card objects).
 */
export function mapEngineStateToStore(engineState: GameState): any {
    return {
        ...engineState,
        players: [
            mapPlayerState(engineState.players[0]),
            mapPlayerState(engineState.players[1])
        ],
        // Terrains might contain units with circular refs too
        terrains: engineState.terrains.map(t => ({
            ...t,
            slots: {
                0: { ...t.slots[0], unit: t.slots[0].unit ? mapUnitState(t.slots[0].unit) : null },
                1: { ...t.slots[1], unit: t.slots[1].unit ? mapUnitState(t.slots[1].unit) : null }
            }
        })),
        // Shallow copy others is fine for now if they are primitives
    };
}

function mapPlayerState(player: any) {
    // Exclude 'engine' and other complex objects
    return {
        id: player.id,
        sp: player.sp,
        skirmishesWon: player.skirmishesWon,
        hand: [], // We hydrate hand separately in the store anyway? Or we should map it here?
                  // The store uses UI CardInstances for hand, so we don't need engine cards here.
                  // But we might want count?
        deck: [], // Don't need full deck in UI store usually
        graveyard: player.graveyard ? player.graveyard.map((c: any) => ({ id: c.id, name: c.name })) : []
    };
}

function mapUnitState(unit: any) {
    // Minimal unit data for state references if needed
    // The UI mainly uses the BoardSlots for rendering, which are separate.
    return {
        id: unit.id,
        name: unit.name,
        power: unit.power,
        owner: unit.owner
    };
}
