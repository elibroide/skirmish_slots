import type { UnitCard } from '../../cards/Card';
import type { TriggerConfig } from './ReactTypes';
import { TargetResolver } from './TargetResolver';
export declare class TriggerManager {
    private engine;
    private owner;
    private targetResolver;
    private onTrigger;
    private listeners;
    constructor(engine: any, owner: UnitCard, targetResolver: TargetResolver, onTrigger: (trigger: TriggerConfig, event: any) => void);
    register(triggers: TriggerConfig[]): void;
    unregister(): void;
    private mapTriggerToEvent;
    private matches;
    private getEventSource;
}
