import { Trait } from './Trait';
/**
 * DeployConditionTrait modifies deployment targeting rules
 * Used for cards like Dragon that can only be deployed under specific conditions
 */
export class DeployConditionTrait extends Trait {
    constructor(config, owner) {
        super(`DeployCondition:${config.condition}`);
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: config
        });
        if (owner) {
            this.owner = owner;
        }
    }
    /**
     * Override the unit's getValidTargets method when attached
     */
    onAttach(card) {
        super.onAttach(card);
        // Store the original getValidTargets method
        const originalGetValidTargets = card.getValidTargets.bind(card);
        // Override with condition-modified version
        card.getValidTargets = (state) => {
            if (this.config.condition === 'MUST_CONSUME_UNIT') {
                return this.getMustConsumeTargets(state, originalGetValidTargets);
            }
            return originalGetValidTargets(state);
        };
    }
    /**
     * Get valid targets when unit must consume another unit
     */
    getMustConsumeTargets(state, _originalMethod) {
        const validSlots = [];
        const terrains = state.terrains;
        terrains.forEach((terrain, index) => {
            const terrainId = index;
            const slot = terrain.slots[this.owner.owner];
            // For MUST_CONSUME, we require an occupied slot (opposite of normal deployment)
            // Don't call isDeploymentAllowed() - it rejects occupied slots by default
            if (slot.unit) {
                // Check valid target filter
                if (!this.config.validTargets || this.config.validTargets === 'ALLIES') {
                    // Only allow consuming own units
                    validSlots.push({ terrainId, playerId: this.owner.owner });
                }
                else if (this.config.validTargets === 'ANY') {
                    // Allow consuming any unit (implement if needed)
                    validSlots.push({ terrainId, playerId: this.owner.owner });
                }
            }
        });
        return {
            type: 'slots',
            validSlots,
        };
    }
}
