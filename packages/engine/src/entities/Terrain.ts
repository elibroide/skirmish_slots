import { GameEntity } from './base/GameEntity';
import type { GameEngine } from '../core/GameEngine';
import type { PlayerId, TerrainId, TerrainState, PlayerSlotId } from '../core/types';
import { Slot } from './Slot';

export class Terrain extends GameEntity {
  public readonly id: TerrainId;
  private _slots: [Slot, Slot];
  private _winner: PlayerId | null = null;

  constructor(engine: GameEngine, id: TerrainId) {
    // Owner is irrelevant for Terrain
    super(engine); 
    this.id = id;
    this._slots = [
      new Slot(engine, id, 0),
      new Slot(engine, id, 1)
    ];
  }

  // Accessors
  public get slots(): [Slot, Slot] { return this._slots; }
  public get winner(): PlayerId | null { return this._winner; }

  // Mutators
  public setWinner(winner: PlayerId | null): void {
    this._winner = winner;
  }

  public getSlot(playerId: PlayerId): Slot {
    return this._slots[playerId as PlayerSlotId];
  }

  public toState(): TerrainState {
    return {
      id: this.id,
      slots: {
        0: this._slots[0].toState(),
        1: this._slots[1].toState()
      },
      winner: this._winner
    };
  }
}
