import { ActionCard } from '../Card';
import type { PlayerId, GameState, TargetInfo } from '../../../core/types';
import type { GameEngine } from '../../../core/GameEngine';
import type { SlotCoord } from '../../../systems/rules/RuleTypes';
export declare class Repositioning extends ActionCard {
    constructor(owner: PlayerId, engine: GameEngine);
    needsTarget(): boolean;
    getValidTargets(state: GameState): TargetInfo;
    play(targetSlot?: SlotCoord): Promise<void>;
    private hasAdjacentSlot;
    private getAdjacentSlots;
}
