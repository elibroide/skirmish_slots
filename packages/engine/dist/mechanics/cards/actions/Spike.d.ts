import { ActionCard } from '../Card';
import type { PlayerId, GameState, TargetInfo } from '../../../core/types';
import type { GameEngine } from '../../../core/GameEngine';
export declare class Spike extends ActionCard {
    constructor(owner: PlayerId, engine: GameEngine);
    needsTarget(): boolean;
    getValidTargets(state: GameState): TargetInfo;
    play(targetSlot: any): Promise<void>;
}
