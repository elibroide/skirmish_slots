import { ContinuousTrait } from '../ContinuousTrait';
/**
 * PowerModifierTrait
 * A specific passive trait that modifies the power of targets using the Rule System.
 */
export class PowerModifierTrait extends ContinuousTrait {
    constructor(config, owner) {
        super(`PowerMod:${config.value}`, owner);
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: config
        });
    }
    register() {
        const modifier = (context, currentPower) => {
            const powerContext = context;
            if (!powerContext.unit)
                return currentPower;
            // Check if unit matches our target scope
            if (this.matchesTarget(powerContext.unit)) {
                // Check custom condition
                if (this.config.condition && !this.config.condition(powerContext.unit)) {
                    return currentPower;
                }
                return currentPower + Number(this.config.value);
            }
            return currentPower;
        };
        this.engine.ruleManager.registerRule(this.id, 'MODIFY_POWER', modifier);
    }
    // Simplified matching logic specific to this trait's needs
    matchesTarget(candidate) {
        const type = this.config.target;
        if (type === 'SELF') {
            return candidate.id === this.owner.id;
        }
        if (candidate.owner === this.owner.owner) {
            // Ally Scope
            if (type === 'CLOSE_ALLY')
                return this.isClose(candidate);
        }
        else {
            // Enemy Scope
            if (type === 'CLOSE_ENEMY')
                return this.isClose(candidate);
            if (type === 'ALL_ENEMIES')
                return true;
        }
        return false;
    }
    isClose(candidate) {
        const myTerrain = this.owner.terrainId;
        const theirTerrain = candidate.terrainId;
        if (myTerrain === null || theirTerrain === null)
            return false;
        // Adjacent or same terrain logic
        const diff = Math.abs(myTerrain - theirTerrain);
        return diff <= 1;
    }
}
