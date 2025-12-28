import { ActionCard } from '../Card';
import type { PlayerId, GameState, SlotCoord, TargetInfo } from '../../../core/types';
import type { GameEngine } from '../../../core/GameEngine';
export declare class Seed extends ActionCard {
    constructor(owner: PlayerId, engine: GameEngine);
    needsTarget(): boolean;
    getValidTargets(state: GameState): TargetInfo;
    play(target: SlotCoord): Promise<void>;
}
