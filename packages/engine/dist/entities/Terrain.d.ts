import { GameEntity } from './base/GameEntity';
import type { GameEngine } from '../core/GameEngine';
import type { PlayerId, TerrainId, TerrainState } from '../core/types';
import { Slot } from './Slot';
export declare class Terrain extends GameEntity {
    readonly id: TerrainId;
    private _slots;
    private _winner;
    constructor(engine: GameEngine, id: TerrainId);
    get slots(): [Slot, Slot];
    get winner(): PlayerId | null;
    setWinner(winner: PlayerId | null): void;
    getSlot(playerId: PlayerId): Slot;
    toState(): TerrainState;
}
