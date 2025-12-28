import { PlayerGameEntity } from './base/PlayerGameEntity';
import type { GameEngine } from '../core/GameEngine';
import type { PlayerId, SlotState, UnitState } from '../core/types';
import type { UnitCard } from '../mechanics/cards/Card';

export class Slot extends PlayerGameEntity {
  public terrainId: number;
  public playerId: PlayerId; // Use 'owner' from base? Or keep usage of 'playerId'?
  // Base has 'owner'. 'playerId' was likely 'owner' alias.
  // Let's keep 'playerId' getter or alias if code uses it widely.
  // Actually, let's keep it clean. If I extend PlayerGameEntity, I satisfy 'owner'.
  // But Slot.ts likely uses 'playerId'. I'll check.

  private _unit: UnitCard | null = null;
  private _modifier: number = 0;

  constructor(engine: GameEngine, terrainId: number, playerId: PlayerId) {
    super(engine, playerId);
    this.terrainId = terrainId;
    this.playerId = playerId;
  }

  // Accessors
  public get unit(): UnitCard | null { return this._unit; }
  public get modifier(): number { return this._modifier; }

  // Mutators
  public setUnit(unit: UnitCard | null): void {
    this._unit = unit;
  }

  public setModifier(value: number): void {
    const oldModifier = this._modifier;
    this._modifier = value;

    if (oldModifier !== value) {
      this.engine.emitEvent({
        type: 'SLOT_MODIFIER_CHANGED',
        terrainId: this.terrainId as any, // Cast to TerrainId
        playerId: this.playerId,
        newModifier: value,
        entity: this
      });
    }
  }

  public toState(): SlotState {
    return {
      unit: this._unit ? this._unit.toState() : null,
      modifier: this._modifier
    };
  }
}
