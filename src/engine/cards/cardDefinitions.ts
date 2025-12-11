import type { TraitDefinition } from '../traits/TraitFactory';
import type { UnitCard } from './Card';
import type { GameEngine } from '../GameEngine';
import { RuleType } from '../rules/RuleTypes';
import type { DeploymentContext, TerrainResolutionContext } from '../rules/RuleTypes';

export interface UnitCardDefinition {
  name: string;
  description: string;
  basePower: number;
  traits: TraitDefinition[];
}

export const UNIT_CARD_DEFINITIONS: Record<string, UnitCardDefinition> = {
  // Acolyte (1): Consumed: Consuming unit gets +3
  acolyte: {
    name: 'Acolyte',
    description: 'Consumed: Consuming unit gets +3',
    basePower: 1,
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
    name: 'Apprentice',
    description: 'Consume: Draw a card.',
    basePower: 3,
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
    traits: []
  },

  // Dragon (7): Can only be deployed by consuming another unit
  dragon: {
    name: 'Dragon',
    description: 'I can only be deployed to consume another unit.',
    basePower: 7,
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

  // Engineer (1): On your turn start, my slot gets +1
  engineer: {
    name: 'Engineer',
    description: 'On your turn start, my slot gets +1.',
    basePower: 1,
    traits: [
      {
        type: 'ongoingReaction',
        config: {
          listenTo: 'YOUR_TURN_START',
          target: 'SELF',
          effect: 'ADD_SLOT_MODIFIER',
          value: 1
        }
      }
    ]
  },

  // Ghoul (1): When a close unit dies, I get +2
  ghoul: {
    name: 'Ghoul',
    description: 'When a close unit dies, I get +2.',
    basePower: 1,
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
    traits: [
      {
        type: 'reaction',
        config: {
          trigger: 'ON_DEPLOY',
          target: 'CLOSE_ENEMY',
          targetDecision: 'PLAYER',
          effect: 'KILL',
          value: 0,
          condition: (unit: UnitCard) => unit.power < unit.originalPower
        }
      }
    ]
  },

  // Knight (3): Deploy: You may deploy a Squire to a close ally slot
  knight: {
    name: 'Knight',
    description: 'Deploy: You may deploy a Squire to a close ally slot.',
    basePower: 3,
    traits: [
      {
        type: 'reaction',
        config: {
          trigger: 'ON_DEPLOY',
          target: 'CLOSE_ALLY_SLOT',
          targetDecision: 'PLAYER',
          effect: 'DEPLOY_UNIT',
          value: 'squire' as any // Token card ID to deploy
        }
      }
    ]
  },

  // Mimic (1): Deploy: My power becomes equal to enemy in front of me
  mimic: {
    name: 'Mimic',
    description: 'Deploy: My power becomes equal to the enemy in front of me.',
    basePower: 1,
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
    traits: [
      {
        type: 'activate',
        config: {
          cooldownMax: 1,
          description: 'Reanimate',
          effect: async (owner: UnitCard) => {
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
    traits: [
      {
        type: 'activate',
        config: {
          cooldownMax: 0,
          description: 'Reposition',
          effect: async (owner: UnitCard) => {
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
    traits: [
      {
        type: 'ruleModifier',
        config: {
          ruleType: RuleType.DETERMINE_TERRAIN_WINNER,
          // Modifier: Invert win condition (lowest power wins)
          modifierFunction: function(context, currentWinner) {
            const resolutionContext = context as TerrainResolutionContext;
            const owner = this as unknown as UnitCard;
            
            // Only apply to this terrain
            if (resolutionContext.terrainId !== owner.terrainId) {
              return currentWinner;
            }

            const terrain = owner.engine.state.terrains[owner.terrainId!];
            const unit0 = terrain.slots[0].unit;
            const unit1 = terrain.slots[1].unit;

            // Invert comparison: lowest power wins
            if (unit0 && unit1) {
              const { power0, power1 } = resolutionContext;
              if (power0 < power1) return 0;
              if (power1 < power0) return 1;
              return null; // Tie
            }

            return currentWinner;
          }
        }
      }
    ]
  },

  // Rookie (3): Activate (Cooldown 2): My slot and a close slot get +2
  rookie: {
    name: 'Rookie',
    description: 'Activate (Cooldown 2): My slot and a close slot get +2',
    basePower: 3,
    traits: [
      {
        type: 'activate',
        config: {
          cooldownMax: 2,
          description: 'Fortify',
          effect: async (owner: UnitCard) => {
            // TODO: Implement rookie activation logic
            // This needs slot targeting
          }
        }
      }
    ]
  },

  // Roots (2): Death: My slot gets +X modifier equal to my power
  roots: {
    name: 'Roots',
    description: 'Death: My slot gets +X modifier equal to my power',
    basePower: 2,
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
    traits: [
      {
        type: 'ruleModifier',
        config: {
          ruleType: RuleType.CAN_DEPLOY,
          modifierFunction: function(context, allowed) {
            if (!allowed) return false;

            if (!('deployingCard' in context)) return allowed;
            
            const deployContext = context as DeploymentContext;
            const owner = this as unknown as UnitCard; // 'this' will be bound to the card

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
          effect: async (owner: UnitCard) => {
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
    traits: []
  },

  // Warlock (3): Consume: Deal damage to a close enemy equal to consumed unit's power
  warlock: {
    name: 'Warlock',
    description: 'Consume: I deal damage to a close enemy equal to the consumed unit\'s power.',
    basePower: 3,
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
    traits: []
  },

  // Ninja (1): When a close enemy is deployed, give my slot +1 and move me to another random empty ally slot
  ninja: {
    name: 'Ninja',
    description: 'When a close enemy is deployed, give my slot +1 and move me to another random empty ally slot.',
    basePower: 3,
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
  }
};

export type UnitCardId = keyof typeof UNIT_CARD_DEFINITIONS;

