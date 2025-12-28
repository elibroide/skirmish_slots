import { Trait } from './Trait';
import type { UnitCard } from '../cards/Card';
import type { GameEngine } from '../../core/GameEngine';
export type SpecialHook = 'onDeploy' | 'onDeath' | 'onConquer' | 'onTurnStart';
/**
 * SpecialTrait is an escape hatch for unique complex mechanics
 * Used for cards like Knight (deploy squire), Mimic (copy power), Priest (cleanse)
 */
export declare class SpecialTrait extends Trait {
    private hook;
    private implementation;
    constructor(hook: SpecialHook, implementation: (owner: UnitCard, engine: GameEngine) => Promise<void> | void, name?: string, owner?: UnitCard);
    onDeploy(): Promise<void>;
    onDeath(): Promise<void>;
    onConquer(): Promise<void>;
    onTurnStart(): void;
}
