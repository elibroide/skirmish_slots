import { PlayerGameEntity } from './base/PlayerGameEntity';
import type { GameEngine } from '../core/GameEngine';
import type { PlayerId, SlotState } from '../core/types';
import type { UnitCard } from '../mechanics/cards/Card';
export declare class Slot extends PlayerGameEntity {
    terrainId: number;
    playerId: PlayerId;
    private _unit;
    private _modifier;
    constructor(engine: GameEngine, terrainId: number, playerId: PlayerId);
    get unit(): UnitCard | null;
    get modifier(): number;
    setUnit(unit: UnitCard | null): void;
    setModifier(value: number): void;
    toState(): SlotState;
}
