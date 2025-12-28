import { Trait } from './Trait';
/**
 * SpecialTrait is an escape hatch for unique complex mechanics
 * Used for cards like Knight (deploy squire), Mimic (copy power), Priest (cleanse)
 */
export class SpecialTrait extends Trait {
    constructor(hook, implementation, name = 'Special', owner) {
        super(name);
        Object.defineProperty(this, "hook", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: hook
        });
        Object.defineProperty(this, "implementation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: implementation
        });
        if (owner) {
            this.owner = owner;
        }
    }
    async onDeploy() {
        if (this.hook === 'onDeploy') {
            await this.implementation(this.owner, this.engine);
        }
    }
    async onDeath() {
        if (this.hook === 'onDeath') {
            await this.implementation(this.owner, this.engine);
        }
    }
    async onConquer() {
        if (this.hook === 'onConquer') {
            await this.implementation(this.owner, this.engine);
        }
    }
    onTurnStart() {
        if (this.hook === 'onTurnStart') {
            this.implementation(this.owner, this.engine);
        }
    }
}
