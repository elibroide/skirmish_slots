import { Trait } from './Trait';
import type { UnitCard } from '../cards/Card';
export type DominantEffectType = 'ADD_POWER' | 'DEAL_DAMAGE' | 'ADD_SHIELD' | 'DRAW_CARDS' | 'CREATE_CARDS';
export type DominantTargetType = 'SELF' | 'CLOSE_ALLY' | 'CLOSE_ENEMY' | 'IN_FRONT';
export interface DominantConfig {
    effect: DominantEffectType;
    target?: DominantTargetType;
    value: number | string;
}
/**
 * DominantTrait - "Dominant: [Effect]"
 *
 * Triggers ONCE when owner's turn starts AND they control the lane
 * (unit power > enemy power in same terrain).
 *
 * The trigger state is tracked on the unit itself via `dominantTriggered`
 * so it can be displayed in the UI.
 */
export declare class DominantTrait extends Trait {
    private config;
    private unsubscribe?;
    constructor(config: DominantConfig, owner?: UnitCard);
    onAttach(card: UnitCard): void;
    onDeploy(): Promise<void>;
    onLeave(): void;
    onDetach(): void;
    private subscribeToEvents;
    private handleEvent;
    /**
     * Check if this unit is dominant in its lane
     * Dominant = unit power > enemy power in same terrain
     */
    private isDominant;
    private executeEffect;
    private applyEffect;
    private getTargets;
}
