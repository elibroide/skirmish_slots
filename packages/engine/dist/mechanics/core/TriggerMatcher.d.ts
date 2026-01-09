import type { GameEvent } from '../../core/types';
import type { UnitCard } from '../cards/Card';
import type { TriggerObjectConfig } from './Trigger';
export declare class TriggerMatcher {
    static matches(config: TriggerObjectConfig, event: GameEvent, owner: UnitCard): boolean;
    private static findUnitById;
}
