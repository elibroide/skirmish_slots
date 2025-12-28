import { Trait } from './Trait';
import type { UnitCard } from '../cards/Card';
import type { GameEvent } from '../../core/types';
import { TriggerEffect } from '../effects/TriggerEffect';

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
export class DominantTrait extends Trait {
  private unsubscribe?: () => void;

  constructor(
    private config: DominantConfig,
    owner?: UnitCard
  ) {
    super('Dominant');
    if (owner) {
      this.owner = owner;
    }
  }

  onAttach(card: UnitCard): void {
    super.onAttach(card);

    // Mark that this unit has the Dominant trait
    card.hasDominant = true;
    card.dominantTriggered = false;

    // If card is already on battlefield, subscribe immediately
    if (card.terrainId !== null) {
      this.subscribeToEvents();
    }
  }

  async onDeploy(): Promise<void> {
    // Reset triggered state on deploy (in case bounced and redeployed)
    this.owner.dominantTriggered = false;

    // Subscribe when entering battlefield (if not already subscribed)
    if (!this.unsubscribe) {
      this.subscribeToEvents();
    }
  }

  onLeave(): void {
    // Unsubscribe when leaving battlefield
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  onDetach(): void {
    // Final cleanup
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  private subscribeToEvents(): void {
    this.unsubscribe = this.engine.onEvent((event) => {
      this.handleEvent(event);
    });
  }

  private handleEvent(event: GameEvent): void {
    // Only listen for YOUR_TURN_START (mapped from TURN_CHANGED)
    if (event.type !== 'TURN_CHANGED' || event.playerId !== this.owner.owner) {
      return;
    }

    // Check if already triggered
    if (this.owner.dominantTriggered) {
      return;
    }

    // Check if we control the lane (Dominant condition)
    if (!this.isDominant()) {
      return;
    }

    // Mark as triggered
    this.owner.dominantTriggered = true;

    // Execute the effect
    this.executeEffect();
  }

  /**
   * Check if this unit is dominant in its lane
   * Dominant = unit power > enemy power in same terrain
   */
  private isDominant(): boolean {
    if (this.owner.terrainId === null) return false;

    const terrain = this.engine.terrains[this.owner.terrainId];
    const mySlot = terrain.slots[this.owner.owner];
    const enemySlot = terrain.slots[this.engine.getOpponent(this.owner.owner)];

    const myPower = (mySlot.unit?.power || 0) + mySlot.modifier;
    const enemyPower = (enemySlot.unit?.power || 0) + enemySlot.modifier;

    return myPower > enemyPower;
  }

  private executeEffect(): void {
    const logic = async () => {
      await this.applyEffect();
    };

    this.engine.addInterrupt(
      new TriggerEffect(this.owner, 'Dominant', logic)
    );
  }

  private async applyEffect(): Promise<void> {
    const targets = this.getTargets();

    for (const target of targets) {
      switch (this.config.effect) {
        case 'ADD_POWER':
          await target.addPower(this.config.value as number);
          break;

        case 'DEAL_DAMAGE':
          await target.dealDamage(this.config.value as number);
          break;

        case 'ADD_SHIELD':
          await target.addShield(this.config.value as number);
          break;

        case 'DRAW_CARDS': {
          const player = this.engine.getPlayer(this.owner.owner);
          const count = this.config.value as number;
          await player.draw(count);
          break;
        }

        case 'CREATE_CARDS': {
          // value should be a string like "spike:2" meaning create 2 spike cards
          const valueStr = String(this.config.value);
          const [cardId, countStr] = valueStr.includes(':') ? valueStr.split(':') : [valueStr, '1'];
          const count = parseInt(countStr, 10) || 1;

          const { createCard } = await import('../cards');
          const player = this.engine.getPlayer(this.owner.owner);

          for (let i = 0; i < count; i++) {
            const card = createCard(cardId, this.owner.owner, this.engine);
            // addToHand now handles event emission
            await player.addToHand(card);
          }
          break;
        }
      }
    }
  }

  private getTargets(): UnitCard[] {
    const target = this.config.target || 'SELF';

    switch (target) {
      case 'SELF':
        return [this.owner];
      case 'CLOSE_ALLY':
        return this.owner.getCloseAllies();
      case 'CLOSE_ENEMY':
        return this.owner.getCloseEnemies();
      case 'IN_FRONT': {
        const inFront = this.owner.getUnitInFront();
        return inFront ? [inFront] : [];
      }
      default:
        return [this.owner];
    }
  }
}
