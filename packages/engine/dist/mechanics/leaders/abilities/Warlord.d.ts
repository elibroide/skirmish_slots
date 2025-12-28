import { Leader } from '../Leader';
/**
 * Warlord Leader: Deal 1 damage to an enemy unit
 * Requires selecting a target enemy unit.
 */
export declare class Warlord extends Leader {
    execute(): Promise<void>;
    canActivate(): boolean;
}
