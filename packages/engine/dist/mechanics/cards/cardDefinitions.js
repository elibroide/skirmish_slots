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
                    trigger: 'ON_CONSUMED',
                    target: 'CONSUMING_UNIT',
                    effect: 'ADD_POWER',
                    value: 3
                }
            }
        ]
    },
    // Apprentice (3): Consume: Draw a card
    apprentice: {
        name: 'Hopeless Apprentice',
        description: 'Consume: Draw a card.',
        basePower: 3,
        rarity: 'Bronze',
        color: 'Purple',
        unitType: 'Human Mage',
        traits: [
            {
                type: 'reaction',
                config: {
                    trigger: 'ON_CONSUME',
                    effect: 'DRAW_CARDS',
                    value: 1
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
                    trigger: 'ON_DEPLOY',
                    target: 'CLOSE_ENEMY',
                    targetDecision: 'PLAYER',
                    effect: 'DEAL_DAMAGE',
                    value: 2
                }
            }
        ]
    },
    // Bard (2): When your turn starts, close allies get +1
    bard: {
        name: 'Bard',
        description: 'When your turn starts, close allies get +1.',
        basePower: 2,
        rarity: 'Silver',
        color: 'Red',
        unitType: 'Human Bard',
        traits: [
            {
                type: 'ongoingReaction',
                config: {
                    listenTo: 'YOUR_TURN_START',
                    target: 'CLOSE_ALLY',
                    targetDecision: 'ALL',
                    effect: 'ADD_POWER',
                    value: 1
                }
            }
        ]
    },
    // Champion (5): Pure stats, no ability
    champion: {
        name: 'Champion',
        description: '',
        basePower: 5,
        rarity: 'Silver',
        color: 'Red',
        unitType: 'Human Warrior',
        traits: []
    },
    // Dragon (7): Can only be deployed by consuming another unit
    dragon: {
        name: 'Dragon',
        description: 'I can only be deployed to consume another unit.',
        basePower: 7,
        rarity: 'Gold',
        color: 'Red',
        unitType: 'Dragon',
        traits: [
            {
                type: 'deployCondition',
                config: {
                    condition: 'MUST_CONSUME_UNIT',
                    validTargets: 'ALLIES'
                }
            }
        ]
    },
    engineer: {
        name: 'Engineer',
        description: 'On your turn start, my slot gets +2.',
        basePower: 1,
        rarity: 'Silver',
        color: 'Purple',
        unitType: 'Gnome Engineer',
        traits: [
            {
                type: 'ongoingReaction',
                config: {
                    listenTo: 'YOUR_TURN_START',
                    target: 'SELF',
                    effect: 'ADD_SLOT_MODIFIER',
                    value: 2
                }
            }
        ]
    },
    // Ghoul (1): When a close unit dies, I get +2
    ghoul: {
        name: 'Ghoul',
        description: 'When a close unit dies, I get +2.',
        basePower: 1,
        rarity: 'Bronze',
        color: 'Purple',
        unitType: 'Undead Ghoul',
        traits: [
            {
                type: 'ongoingReaction',
                config: {
                    listenTo: 'UNIT_DIED',
                    proximity: 'CLOSE',
                    target: 'SELF',
                    effect: 'ADD_POWER',
                    value: 2
                }
            }
        ]
    },
    // Hunter (4): Deploy: Kill a close wounded unit
    hunter: {
        name: 'Hunter',
        description: 'Kill a close wounded enemy.',
        basePower: 4,
        rarity: 'Silver',
        color: 'Red',
        unitType: 'Human Hunter',
        traits: [
            {
                type: 'reaction',
                config: {
                    trigger: 'ON_DEPLOY',
                    target: 'CLOSE_ENEMY',
                    targetDecision: 'PLAYER',
                    effect: 'KILL',
                    value: 0,
                    condition: (unit) => unit.power < unit.originalPower
                }
            }
        ]
    },
    // Knight (3): Deploy: You may deploy a Squire to a close ally slot
    knight: {
        name: 'Knight',
        description: 'Deploy: You may deploy a Squire to a close ally slot.',
        basePower: 3,
        rarity: 'Gold',
        color: 'Red',
        unitType: 'Human Knight',
        traits: [
            {
                type: 'reaction',
                config: {
                    trigger: 'ON_DEPLOY',
                    target: 'CLOSE_ALLY_SLOT',
                    targetDecision: 'PLAYER',
                    effect: 'DEPLOY_UNIT',
                    value: 'squire' // Token card ID to deploy
                }
            }
        ]
    },
    // Mimic (1): Deploy: My power becomes equal to enemy in front of me
    mimic: {
        name: 'Mimic',
        description: 'Deploy: My power becomes equal to the enemy in front of me.',
        basePower: 1,
        rarity: 'Silver',
        color: 'Purple',
        unitType: 'Shapechanger',
        traits: [
            {
                type: 'reaction',
                config: {
                    trigger: 'ON_DEPLOY',
                    target: 'SELF',
                    effect: 'SET_POWER',
                    value: (context) => {
                        const enemyInFront = context.unit.getUnitInFront();
                        return enemyInFront ? enemyInFront.power : context.unit.originalPower;
                    }
                }
            }
        ]
    },
    // Necromancer (2): Activate (Cooldown 1): Deploy a dead ally with power 3 or less
    necromancer: {
        name: 'Necromancer',
        description: 'Activate (cooldown 1): You may deploy a dead ally with power 3 or less.',
        basePower: 2,
        rarity: 'Gold',
        color: 'Purple',
        unitType: 'Human Warlock',
        traits: [
            {
                type: 'activate',
                config: {
                    cooldownMax: 1,
                    description: 'Reanimate',
                    effect: async (owner) => {
                        // TODO: Implement necromancer activation logic
                        // This needs special handling for graveyard selection
                    }
                }
            }
        ]
    },
    // Noble (4): Conquer: Draw 2 cards
    noble: {
        name: 'Noble',
        description: 'Conquer: Draw two cards.',
        basePower: 4,
        rarity: 'Silver',
        color: 'Purple',
        unitType: 'Human Noble',
        traits: [
            {
                type: 'reaction',
                config: {
                    trigger: 'ON_CONQUER',
                    effect: 'DRAW_CARDS',
                    value: 2
                }
            }
        ]
    },
    // Priest (2): Deploy: Cleanse a close slot
    priest: {
        name: 'Priest',
        description: 'Deploy: Cleanse a close slot (remove all modifiers from slot and buffs from unit)',
        basePower: 2,
        rarity: 'Bronze',
        color: 'Purple',
        unitType: 'Human Cleric',
        traits: [
            {
                type: 'reaction',
                config: {
                    trigger: 'ON_DEPLOY',
                    target: 'SLOT', // Will target close slots
                    targetDecision: 'PLAYER',
                    effect: 'CLEANSE',
                    value: 0
                }
            }
        ]
    },
    // Ranger (4): Activate: Move me to a close ally slot
    ranger: {
        name: 'Ranger',
        description: 'Activate: Move me to a close ally slot.',
        basePower: 4,
        rarity: 'Bronze',
        color: 'Red',
        unitType: 'Elf Ranger',
        traits: [
            {
                type: 'activate',
                config: {
                    cooldownMax: 0,
                    description: 'Reposition',
                    effect: async (owner) => {
                        // TODO: Implement ranger movement logic
                        // This needs special handling for unit movement
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
                    // Modifier: Invert win condition (lowest power wins)
                    modifierFunction: function (context, currentWinner) {
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
    underdog: {
        name: 'Underdog',
        description: 'When a close ally deploys for the first time each turn, give me and that ally +3.',
        basePower: 1,
        rarity: 'Silver',
        color: 'Red',
        unitType: 'Human Commoner',
        traits: [
            {
                type: 'ongoingReaction',
                config: {
                    listenTo: 'UNIT_DEPLOYED',
                    proximity: 'CLOSE',
                    filter: (() => {
                        // Track which turn each card instance last triggered (keyed by card id)
                        const lastTriggeredTurn = new Map();
                        return (event, owner) => {
                            // Only trigger for ally deployments (not self)
                            if (!('playerId' in event) || event.playerId !== owner.owner) {
                                return false;
                            }
                            // Don't trigger for our own deployment
                            if ('unitId' in event && event.unitId === owner.id) {
                                return false;
                            }
                            // Check if we've already triggered this turn
                            const currentTurn = owner.engine.state.currentTurn;
                            if (lastTriggeredTurn.get(owner.id) === currentTurn) {
                                return false;
                            }
                            // Mark as triggered for this turn
                            lastTriggeredTurn.set(owner.id, currentTurn);
                            return true;
                        };
                    })(),
                    effects: [
                        {
                            target: 'SELF',
                            effect: 'ADD_POWER',
                            value: 3
                        },
                        {
                            target: 'EVENT_SOURCE',
                            effect: 'ADD_POWER',
                            value: 3
                        }
                    ]
                }
            }
        ]
    },
    // Roots (2): Death: My slot gets +X modifier equal to my power
    roots: {
        name: 'Roots',
        description: 'Death: My slot gets +X modifier equal to my power',
        basePower: 2,
        rarity: 'Bronze',
        color: 'Purple',
        unitType: 'Plant Spirit',
        traits: [
            {
                type: 'reaction',
                config: {
                    trigger: 'ON_DEATH',
                    target: 'SLOT',
                    effect: 'ADD_SLOT_MODIFIER',
                    value: (context) => context.unit.power
                }
            }
        ]
    },
    // Scout (2): Deploy: Draw a card
    scout: {
        name: 'Scout',
        description: 'Deploy: Draw a card.',
        basePower: 2,
        rarity: 'Bronze',
        color: 'Red',
        unitType: 'Human Scout',
        traits: [
            {
                type: 'reaction',
                config: {
                    trigger: 'ON_DEPLOY',
                    effect: 'DRAW_CARDS',
                    value: 1
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
                    modifierFunction: function (context, allowed) {
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
    // Turret (3): When an enemy deploys close to me, deal 1 damage to them (zone control)
    turret: {
        name: 'Turret',
        description: 'When your turn ends, deal 1 damage to a random enemy.',
        basePower: 3,
        rarity: 'Gold',
        color: 'Purple',
        unitType: 'Construct Turret',
        traits: [
            {
                type: 'ongoingReaction',
                config: {
                    listenTo: 'YOUR_TURN_ENDS',
                    target: 'CLOSE_ENEMY',
                    effect: 'DEAL_DAMAGE',
                    value: 1
                }
            }
        ]
    },
    // Vampire (2): When a close unit is dealt damage, I gain that much power + Activate (Cooldown 1): Deal 2 damage to a close unit
    vampire: {
        name: 'Vampire',
        description: 'When a close unit is dealt damage, I gain that much power. Activate (Cooldown 1): Deal 2 damage to a close unit.',
        basePower: 2,
        rarity: 'Gold',
        color: 'Purple',
        unitType: 'Undead Vampire',
        traits: [
            {
                type: 'ongoingReaction',
                config: {
                    listenTo: 'UNIT_DAMAGED',
                    proximity: 'CLOSE',
                    target: 'SELF',
                    effect: 'ADD_POWER',
                    value: (event) => ('amount' in event ? event.amount : 0) || 0
                }
            },
            {
                type: 'activate',
                config: {
                    cooldownMax: 1,
                    description: 'Blood Drain',
                    effect: async (owner) => {
                        // TODO: Implement vampire activation logic
                        // Needs to target close unit for damage
                    }
                }
            }
        ]
    },
    // Veteran (4): Pure stats, no ability
    veteran: {
        name: 'Veteran',
        description: '(Pure stats, no ability)',
        basePower: 4,
        rarity: 'Bronze',
        color: 'Red',
        unitType: 'Human Veteran',
        traits: []
    },
    // Warlock (3): Consume: Deal damage to a close enemy equal to consumed unit's power
    warlock: {
        name: 'Warlock',
        description: 'Consume: I deal damage to a close enemy equal to the consumed unit\'s power.',
        basePower: 3,
        rarity: 'Silver',
        color: 'Purple',
        unitType: 'Human Warlock',
        traits: [
            {
                type: 'reaction',
                config: {
                    trigger: 'ON_CONSUME',
                    target: 'CLOSE_ENEMY',
                    targetDecision: 'PLAYER',
                    effect: 'DEAL_DAMAGE',
                    value: (context) => context.victim ? context.victim.power : 0
                }
            }
        ]
    },
    // Wizard (3): When you play an action, give my slot +2
    wizard: {
        name: 'Wizard',
        description: 'When you play an action, give my slot +2.',
        basePower: 3,
        rarity: 'Silver',
        color: 'Purple',
        unitType: 'Human Wizard',
        traits: [
            {
                type: 'ongoingReaction',
                config: {
                    listenTo: 'CARD_PLAYED',
                    filter: (event, owner) => {
                        return event.type === 'CARD_PLAYED' &&
                            event.playerId === owner.owner &&
                            event.cardId !== owner.id &&
                            event.cardType === 'action';
                    },
                    target: 'SELF',
                    effect: 'ADD_SLOT_MODIFIER',
                    value: 2
                }
            }
        ]
    },
    // Squire (1): Created by Knight
    squire: {
        name: 'Squire',
        description: '',
        basePower: 1,
        rarity: 'Bronze',
        color: 'Red',
        unitType: 'Human Squire',
        traits: []
    },
    // Warrior (4): Deploy: Gain 2 Shield
    warrior: {
        name: 'Warrior',
        description: 'Deploy: Gain 2 Shield.',
        basePower: 4,
        rarity: 'Bronze',
        color: 'Red',
        unitType: 'Human Warrior',
        traits: [
            {
                type: 'reaction',
                config: {
                    trigger: 'ON_DEPLOY',
                    target: 'SELF',
                    effect: 'ADD_SHIELD',
                    value: 2
                }
            }
        ]
    },
    // Ninja (1): When a close enemy is deployed, give my slot +1 and move me to another random empty ally slot
    ninja: {
        name: 'Ninja',
        description: 'When a close enemy is deployed, give my slot +1 and move me to another random empty ally slot.',
        basePower: 3,
        rarity: 'Gold',
        color: 'Purple',
        unitType: 'Human Ninja',
        traits: [
            {
                type: 'ongoingReaction',
                config: {
                    listenTo: 'UNIT_DEPLOYED',
                    proximity: 'IN_FRONT',
                    filter: (event, owner) => {
                        return 'playerId' in event && event.playerId !== owner.owner;
                    },
                    effects: [
                        {
                            target: 'SELF',
                            effect: 'ADD_SLOT_MODIFIER',
                            value: 1
                        },
                        {
                            target: 'SELF',
                            effect: 'MOVE',
                            value: 0
                        }
                    ]
                }
            }
        ]
    },
    // Thief (3): Deploy: Steal slot modifier from a close slot
    thief: {
        name: 'Thief',
        description: 'Deploy: Steal slot modifier from a close slot.',
        basePower: 3,
        rarity: 'Silver',
        color: 'Purple',
        unitType: 'Human Thief',
        traits: [
            {
                type: 'reaction',
                config: {
                    trigger: 'ON_DEPLOY',
                    effects: [
                        {
                            // First effect: Remove modifier from target slot
                            target: 'SLOT',
                            targetDecision: 'PLAYER',
                            effect: 'REMOVE_SLOT_MODIFIER',
                            value: 0
                        },
                        {
                            // Second effect: Add the stolen amount to own slot
                            target: 'SELF',
                            effect: 'ADD_SLOT_MODIFIER',
                            value: (context) => context.effectResults[0]?.amount || 0
                        }
                    ]
                }
            }
        ]
    },
    // Zombie (2): Consume: +3
    zombie: {
        name: 'Zombie',
        description: 'Consume: +3',
        basePower: 2,
        rarity: 'Bronze',
        color: 'Purple',
        unitType: 'Undead Zombie',
        traits: [
            {
                type: 'reaction',
                config: {
                    trigger: 'ON_CONSUME',
                    target: 'SELF',
                    effect: 'ADD_POWER',
                    value: 3
                }
            }
        ]
    },
    // Berserker (4): Turn starts: Heal me. When I'm healed, I get bonus equal to power I gained.
    berserker: {
        name: 'Berserker',
        description: 'Turn starts: Heal me. When I\'m healed, I get bonus equal to power I gained.',
        basePower: 4,
        rarity: 'Silver',
        color: 'Red',
        unitType: 'Human Berserker',
        traits: [
            {
                type: 'ongoingReaction',
                config: {
                    listenTo: 'YOUR_TURN_START',
                    target: 'SELF',
                    effect: 'HEAL',
                    value: 999 // Heal fully
                }
            },
            {
                type: 'ongoingReaction',
                config: {
                    listenTo: 'UNIT_HEALED',
                    filter: (event, owner) => {
                        return 'unitId' in event && event.unitId === owner.id;
                    },
                    target: 'SELF',
                    effect: 'ADD_POWER',
                    value: (event) => ('amount' in event ? event.amount : 0) || 0
                }
            }
        ]
    },
    // Arms Peddler (5): Dominant: Draw two Spikes. This triggers only once.
    armsPeddler: {
        name: 'Arms Peddler',
        description: 'Dominant: Draw two Spikes. This triggers only once.',
        basePower: 5,
        rarity: 'Gold',
        color: 'Red',
        unitType: 'Human Merchant',
        traits: [
            {
                type: 'ongoingReaction',
                config: {
                    listenTo: 'YOUR_TURN_START',
                    filter: (() => {
                        // Track if this instance has triggered (resets when bounced/redeployed)
                        const hasTriggered = new WeakMap();
                        return (_event, owner) => {
                            // Check if already triggered
                            if (hasTriggered.get(owner)) {
                                return false;
                            }
                            // Check Dominant: controlling the lane (higher power in terrain)
                            if (owner.terrainId === null)
                                return false;
                            const terrain = owner.engine.state.terrains[owner.terrainId];
                            const mySlot = terrain.slots[owner.owner];
                            const enemySlot = terrain.slots[owner.engine.getOpponent(owner.owner)];
                            const myPower = (mySlot.unit?.power || 0) + mySlot.modifier;
                            const enemyPower = (enemySlot.unit?.power || 0) + enemySlot.modifier;
                            if (myPower <= enemyPower) {
                                return false; // Not dominant
                            }
                            // Mark as triggered
                            hasTriggered.set(owner, true);
                            return true;
                        };
                    })(),
                    target: 'SELF',
                    effect: 'CREATE_CARDS',
                    value: 'spike:2'
                }
            }
        ]
    },
    // Vicious (5): Dominant: +3
    vicious: {
        name: 'Vicious',
        description: 'Dominant: +3',
        basePower: 5,
        rarity: 'Silver',
        color: 'Red',
        unitType: 'Beast',
        traits: [
            {
                type: 'dominant',
                config: {
                    effect: 'ADD_POWER',
                    target: 'SELF',
                    value: 3
                }
            }
        ]
    }
};
