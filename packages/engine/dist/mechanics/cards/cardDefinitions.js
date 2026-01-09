import { RuleType } from '../../systems/rules/RuleTypes';
export const UNIT_CARD_DEFINITIONS = {
    // Acolyte (1): Consumed: Consuming unit gets +3
    acolyte: {
        name: 'Acolyte',
        description: 'Consumed: Consuming unit gets +3',
        basePower: 1,
        rarity: 'Bronze',
        color: 'Red',
        unitType: 'Human Cultist',
        traits: [
            {
                type: 'reaction',
                config: {
                    triggers: [{ type: 'Consume', target: { type: 'Relative', proximity: 'Self' } }],
                    effects: [{
                            type: 'AddPower',
                            target: { type: 'RelativeToTrigger', proximity: 'Self' }, // Targeting the consumer (Source of event)
                            value: { type: 'static', value: 3 }
                        }]
                }
            }
        ]
    },
    // Archer (3): Deploy: Deal 2 damage to a close enemy
    archer: {
        name: 'Archer',
        description: 'Deploy: Deal 2 damage to a close enemy',
        basePower: 3,
        rarity: 'Bronze',
        color: 'Red',
        unitType: 'Elf Archer',
        traits: [
            {
                type: 'reaction',
                config: {
                    triggers: [{ type: 'Deploy', target: { type: 'Relative', proximity: 'Self' } }],
                    effects: [{
                            type: 'DealDamage',
                            target: { type: 'Relative', proximity: 'Close', relationship: 'Enemy' },
                            value: { type: 'static', value: 2 },
                        }]
                }
            }
        ]
    },
    // Sentinel (3): An enemy cannot be deployed in front of me
    sentinel: {
        name: 'Sentinel',
        description: 'An enemy cannot be deployed in front of me.',
        basePower: 2,
        rarity: 'Silver',
        color: 'Red',
        unitType: 'Construct Sentinel',
        traits: [
            {
                type: 'ruleModifier',
                config: {
                    ruleType: RuleType.CAN_DEPLOY,
                    modifier: function (context, allowed) {
                        if (!allowed)
                            return false;
                        if (!('deployingCard' in context))
                            return allowed;
                        const deployContext = context;
                        const owner = this; // 'this' will be bound to the card
                        if (deployContext.deployingCard.owner !== owner.owner) {
                            if (owner.terrainId !== null &&
                                deployContext.targetSlot.terrainId === owner.terrainId &&
                                deployContext.targetSlot.playerId !== owner.owner) {
                                return false;
                            }
                        }
                        return true;
                    }
                }
            }
        ]
    },
    // Rogue (2): This terrain is won by lowest power instead of highest
    rogue: {
        name: 'Rogue',
        description: 'This terrain is won by the lowest power instead of the highest.',
        basePower: 2,
        rarity: 'Gold',
        color: 'Purple',
        unitType: 'Human Rogue',
        traits: [
            {
                type: 'ruleModifier',
                config: {
                    ruleType: RuleType.DETERMINE_TERRAIN_WINNER,
                    modifier: function (context, currentWinner) {
                        const resolutionContext = context;
                        const owner = this;
                        // Only apply to this terrain
                        if (resolutionContext.terrainId !== owner.terrainId) {
                            return currentWinner;
                        }
                        const terrain = owner.engine.state.terrains[owner.terrainId];
                        const unit0 = terrain.slots[0].unit;
                        const unit1 = terrain.slots[1].unit;
                        // Invert comparison: lowest power wins
                        if (unit0 && unit1) {
                            const { power0, power1 } = resolutionContext;
                            if (power0 < power1)
                                return 0;
                            if (power1 < power0)
                                return 1;
                            return null; // Tie
                        }
                        return currentWinner;
                    }
                }
            }
        ]
    },
    /* TEMPLATE FOR MIGRATION
    // Apprentice (3): Consume: Draw a card
    apprentice: {
      name: 'Hopeless Apprentice',
      description: 'Consume: Draw a card.',
      basePower: 3,
      rarity: 'Bronze',
      color: 'Purple',
      unitType: 'Human Mage',
      traits: [
        { // TODO: Migrate to Reaction
        }
      ]
    },
    */
};
