import { Trait } from './Trait';
import type { UnitCard } from '../cards/Card';
import type { GameEngine } from '../../core/GameEngine';

export type SpecialHook = 'onDeploy' | 'onDeath' | 'onConquer' | 'onTurnStart';

/**
 * SpecialTrait is an escape hatch for unique complex mechanics
 * Used for cards like Knight (deploy squire), Mimic (copy power), Priest (cleanse)
 */
export class SpecialTrait extends Trait {
  constructor(
    private hook: SpecialHook,
    private implementation: (owner: UnitCard, engine: GameEngine) => Promise<void> | void,
    name: string = 'Special',
    owner?: UnitCard
  ) {
    super(name);
    if (owner) {
      this.owner = owner;
    }
  }

  async onDeploy(): Promise<void> {
    if (this.hook === 'onDeploy') {
      await this.implementation(this.owner, this.engine);
    }
  }

  async onDeath(): Promise<void> {
    if (this.hook === 'onDeath') {
      await this.implementation(this.owner, this.engine);
    }
  }

  async onConquer(): Promise<void> {
    if (this.hook === 'onConquer') {
      await this.implementation(this.owner, this.engine);
    }
  }

  onTurnStart(): void {
    if (this.hook === 'onTurnStart') {
      this.implementation(this.owner, this.engine);
    }
  }
}

