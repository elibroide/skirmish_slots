import { ActionCard, UnitCard } from '../Card';
import type { PlayerId, GameState, TargetInfo, TerrainId } from '../../types';
import type { GameEngine } from '../../GameEngine';
import type { SlotCoord } from '../../rules/RuleTypes';

export class Repositioning extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super('repositioning', 'Repositioning', 'Move an ally to a close ally slot. If occupied, swap them.', owner, engine);
  }

  needsTarget(): boolean {
    return true;
  }

  getValidTargets(state: GameState): TargetInfo {
    // Return all ally units that have at least one adjacent ally slot
    const validSlots: SlotCoord[] = [];

    state.terrains.forEach((terrain, terrainId) => {
      const unit = terrain.slots[this.owner].unit;
      if (unit) {
        // Check if any adjacent slot exists (empty OR occupied by ally)
        const hasAdjacentSlot = this.hasAdjacentSlot(terrainId as TerrainId);
        if (hasAdjacentSlot) {
          validSlots.push({ terrainId: terrainId as TerrainId, playerId: this.owner });
        }
      }
    });

    return { type: 'slots', validSlots };
  }

  async play(targetSlot?: SlotCoord): Promise<void> {
    if (!targetSlot) return;

    const unit = this.engine.getUnitAt(targetSlot) as UnitCard;
    if (!unit) return;

    // Get valid destination slots (adjacent ally slots - empty or occupied)
    const destinationSlots = this.getAdjacentSlots(targetSlot.terrainId);

    if (destinationSlots.length === 0) return;

    // If only one option, auto-select; otherwise request player input
    let destination: SlotCoord;
    if (destinationSlots.length === 1) {
      destination = destinationSlots[0];
    } else {
      destination = await this.requestInput({
        type: 'target',
        targetType: 'ally_slot',
        validSlots: destinationSlots,
        context: 'Choose destination slot',
      });
    }

    if (!destination) return;

    // Check if destination has a unit (swap) or is empty (move)
    const destUnit = this.engine.getUnitAt(destination) as UnitCard | null;

    if (destUnit) {
      // SWAP: both units exchange positions
      await UnitCard.swap(unit, destUnit);
    } else {
      // MOVE: simple relocation
      await unit.move(destination.terrainId);
    }
  }

  private hasAdjacentSlot(terrainId: TerrainId): boolean {
    return this.getAdjacentSlots(terrainId).length > 0;
  }

  private getAdjacentSlots(fromTerrainId: TerrainId): SlotCoord[] {
    const slots: SlotCoord[] = [];

    // Check left adjacent
    if (fromTerrainId > 0) {
      slots.push({ terrainId: (fromTerrainId - 1) as TerrainId, playerId: this.owner });
    }

    // Check right adjacent
    if (fromTerrainId < 4) {
      slots.push({ terrainId: (fromTerrainId + 1) as TerrainId, playerId: this.owner });
    }

    return slots;
  }
}
