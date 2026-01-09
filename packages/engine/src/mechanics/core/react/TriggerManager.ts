import type { UnitCard } from '../../cards/Card';
import type { TriggerConfig } from './ReactTypes';
import { TargetResolver } from './TargetResolver';

export class TriggerManager {
  private listeners: Function[] = [];

  constructor(
    private engine: any,
    private owner: UnitCard,
    private targetResolver: TargetResolver,
    private onTrigger: (trigger: TriggerConfig, event: any) => void
  ) {}

  public register(triggers: TriggerConfig[]) {
    triggers.forEach(config => {
      const eventName = this.mapTriggerToEvent(config.type);
      console.log(`Registering trigger ${config.type} -> ${eventName} for ${this.owner.name}`);
      
      const listener = (event: any) => {
        // Filter by event type first
        if (event.type !== eventName) return;

        if (this.matches(config, event)) {
          this.onTrigger(config, event);
        }
      };

      // Subscribe returns unsubscribe function
      const unsubscribe = this.engine.events.subscribe(listener);
      this.listeners.push(unsubscribe);
    });
  }

  public unregister() {
    this.listeners.forEach(off => off());
    this.listeners = [];
  }

  private mapTriggerToEvent(triggerType: string): string {
    switch (triggerType) {
      case 'Deploy': return 'UNIT_DEPLOYED';
      case 'Death': return 'UNIT_DIED';
      case 'TurnStart': return 'TURN_START'; // Or specific player turn?
      case 'TurnStarts': return 'TURN_START'; 
      case 'PlayCard': return 'CARD_PLAYED';
      case 'Consume': return 'UNIT_CONSUMED';
      case 'Activate': return 'ABILITY_TRIGGERED';
      default: return triggerType; // Custom or legacy
    }
  }

  private matches(config: TriggerConfig, event: any): boolean {
    // 1. Basic Type Match (handled by event subscription, but double check type if shared events)
    // 2. Specific Params
    if (config.type === 'PlayCard' && config.cardType) {
       // Check event.card.type
       // event.card might be CardData or CardInstance
       const cardType = event.card?.type || event.cardType;
       if (cardType !== config.cardType) return false;
    }

    // 3. Target Filter ("who triggered the event")
    if (config.target) {
        // Resolve the target selector
        // We need to see if the "Event Source" is in the resolved list.
        // Event Source depends on Event Type.
        const source = this.getEventSource(event);
        if (!source) return false;

        // Resolve selector (Relative to OWNER)
        // e.g. "Close Enemy"
        const candidates = this.targetResolver.resolve(config.target, { event }, this.owner);
        
        if (candidates.length === 0) return false;

        const match = candidates.some(cand => {
             if (cand.id && source.id) return cand.id === source.id; // Unit Match
             if (cand.terrainId !== undefined) {
                 const sourceTid = source.terrainId ?? event.terrainId;
                 const sourcePid = source.owner ?? event.playerId;
                 return cand.terrainId === sourceTid && String(cand.playerId) === String(sourcePid); // Slot Match
             }
             return false;
        });

        if (!match) return false;
    }

    return true;
  }

  private getEventSource(event: any): any {
     // Resolves the primary actor of the event
     if (event.entity) return event.entity; // Direct reference from event (robust for dead units)
     
     if (event.type === 'UNIT_DEPLOYED' || event.type === 'UNIT_DIED') {
         return this.engine.getUnit(event.unitId);
     }
     if (event.type === 'CARD_PLAYED') {
         return { owner: event.playerId, type: 'PlayerPhantom' }; // Hacky context for player-based checks
     }
     if (event.type === 'ABILITY_TRIGGERED') {
          // If the ability belongs to the card itself, event.cardId should match.
          if (event.cardId) {
             return this.engine.getUnit(event.cardId);
          }
      }
     return null; 
  }
}
