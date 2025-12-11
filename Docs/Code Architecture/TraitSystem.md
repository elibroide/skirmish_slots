# Trait System (ECS Architecture)

## Overview

Skirmish uses an **Entity-Component-System (ECS)** architecture for unit cards. Units are entities with composable **Trait** components that define their behavior. This enables:

- **Data-driven card definitions** - Cards are defined in `cardDefinitions.ts` as JSON-like configurations
- **Code reuse** - Common patterns (Deploy effects, ongoing triggers) are implemented once as traits
- **Dynamic ability modification** - Units can gain/lose abilities at runtime (e.g., "give shield to allies")
- **Clean separation** - Game logic (traits) is separate from card data

## Core Concepts

### Entity = Unit Card

A `UnitCard` is an entity that:
- Has core stats (`basePower`, `damage`, `buffs`)
- Contains an array of `Trait` components
- Delegates behavior to its traits

### Component = Trait

A `Trait` is a reusable behavior component that:
- Hooks into unit lifecycle events (`onDeploy`, `onDeath`, etc.)
- Can modify unit properties (`modifyPower`, `interceptDamage`)
- Subscribes to game events for ongoing effects

### System = TraitManager + Engine

The engine and trait lifecycle management handle:
- Attaching/detaching traits
- Propagating lifecycle calls to all traits
- Coordinating trait interactions

---

## Trait Types

### 1. ReactionTrait

**Purpose:** One-time lifecycle triggers  
**Examples:** Deploy, Death, Conquer, Consume, Consumed

**Configuration:**
```typescript
{
  type: 'reaction',
  config: {
    trigger: 'ON_DEPLOY' | 'ON_DEATH' | 'ON_CONQUER' | 'ON_CONSUME' | 'ON_CONSUMED',
    target?: TargetType,  // See below for full list
    targetDecision?: 'PLAYER' | 'RANDOM' | 'ALL' | 'FIRST',
    effect: 'DEAL_DAMAGE' | 'ADD_POWER' | 'SET_POWER' | 'DRAW_CARDS' | 'ADD_SLOT_MODIFIER' | 'KILL' | 'CLEANSE' | 'DEPLOY_UNIT',
    value: number | string | ((context: any) => number | string),
    condition?: (target: any) => boolean
  }
}
```

**Available Targets (TargetType):**
- `SELF` - The unit itself
- `CLOSE_ALLY` - Adjacent friendly units
- `CLOSE_ENEMY` - Adjacent enemy units
- `CLOSE_ANY` - Any adjacent unit
- `IN_FRONT` - Enemy unit directly opposite
- `ALL_ENEMIES` - All enemy units
- `SLOT` - Slot locations (for cleanse, modifiers)
- `CLOSE_ALLY_SLOT` - Adjacent friendly slots (for Knight)
- `CONSUMING_UNIT` - ⭐ The unit that consumed this unit (ON_CONSUMED only)
- `CONSUMED_UNIT` - ⭐ The unit this unit consumed (ON_CONSUME only)

**Example - Archer:**
```typescript
archer: {
  name: 'Archer',
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
}
```

**Example - Acolyte (Consumption):**
```typescript
acolyte: {
  name: 'Acolyte',
  basePower: 1,
  traits: [
    {
      type: 'reaction',
      config: {
        trigger: 'ON_CONSUMED',
        target: 'CONSUMING_UNIT',  // Target the unit that ate me!
        effect: 'ADD_POWER',
        value: 3
      }
    }
  ]
}
```

### 2. OngoingReactionTrait

**Purpose:** Continuous event-based triggers  
**Examples:** "When X happens", "At start of turn"

**Configuration:**
```typescript
{
  type: 'ongoingReaction',
  config: {
    listenTo: OngoingTrigger,  // See below for full list
    proximity?: 'CLOSE' | 'IN_FRONT' | 'SAME_TERRAIN',
    filter?: (event: GameEvent, owner: UnitCard) => boolean,
    
    // Single effect (simple cards)
    target?: 'SELF' | 'CLOSE_ALLY' | 'CLOSE_ENEMY' | 'EVENT_SOURCE',
    targetDecision?: 'ALL' | 'SELF',
    effect?: 'ADD_POWER' | 'DEAL_DAMAGE' | 'ADD_SLOT_MODIFIER' | 'BOUNCE',
    value?: number | ((event: GameEvent) => number),
    
    // OR multiple effects (complex cards)
    effects?: Array<{
      target?: 'SELF' | 'CLOSE_ALLY' | 'CLOSE_ENEMY' | 'EVENT_SOURCE',
      targetDecision?: 'ALL' | 'SELF',
      effect: 'ADD_POWER' | 'DEAL_DAMAGE' | 'ADD_SLOT_MODIFIER' | 'BOUNCE',
      value: number | ((event: GameEvent) => number)
    }>
  }
}
```

**Available Triggers (OngoingTrigger):**
- `UNIT_DIED` - When any unit dies
- `UNIT_DAMAGED` - When any unit takes damage
- `UNIT_DEPLOYED` - When any unit is deployed
- `UNIT_POWER_CHANGED` - When unit power changes
- `UNIT_HEALED` - When a unit is healed
- `UNIT_CONSUMED` - When a unit is consumed
- `UNIT_BOUNCED` - When a unit is returned to hand
- `CARD_PLAYED` - When any card is played
- `CARD_DRAWN` - When a card is drawn
- `TURN_CHANGED` - When the turn changes to any player
- `YOUR_TURN_START` - ⭐ When YOUR turn starts (simplified, no filter needed)
- `OPPONENT_TURN_START` - ⭐ When OPPONENT's turn starts (simplified, no filter needed)
- `ROUND_STARTED` - When a new round begins
- `SKIRMISH_STARTED` - When a skirmish starts
- `SKIRMISH_ENDED` - When a skirmish ends
- `TERRAIN_RESOLVED` - When a terrain is resolved
- `ABILITY_ACTIVATED` - When an ability is activated

**Example - Ghoul (When close unit dies):**
```typescript
ghoul: {
  name: 'Ghoul',
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
}
```

**Example - Bard (Your turn start):**
```typescript
bard: {
  name: 'Bard',
  basePower: 2,
  traits: [
    {
      type: 'ongoingReaction',
      config: {
        listenTo: 'YOUR_TURN_START',  // No filter needed!
        target: 'CLOSE_ALLY',
        targetDecision: 'ALL',
        effect: 'ADD_POWER',
        value: 1
      }
    }
  ]
}
```

**Example - Ninja (Multiple effects):**
```typescript
ninja: {
  name: 'Ninja',
  basePower: 2,
  traits: [
    {
      type: 'ongoingReaction',
      config: {
        listenTo: 'UNIT_DEPLOYED',
        proximity: 'CLOSE',
        filter: (event, owner) => event.playerId !== owner.owner,
        effects: [  // Multiple effects execute in order!
          { target: 'SELF', effect: 'BOUNCE', value: 0 },
          { target: 'SELF', effect: 'ADD_SLOT_MODIFIER', value: 1 }
        ]
      }
    }
  ]
}
```

### 3. RuleModifierTrait

**Purpose:** Modify game rules  
**Examples:** Sentinel (block deployment), Rogue (invert power comparison)

**Configuration:**
```typescript
{
  type: 'ruleModifier',
  config: {
    ruleType: RuleType,
    modifierFunction: RuleModifier<T>
  }
}
```

**Example - Sentinel:**
```typescript
sentinel: {
  name: 'Sentinel',
  basePower: 3,
  traits: [
    {
      type: 'ruleModifier',
      config: {
        ruleType: RuleType.CAN_DEPLOY,
        modifierFunction: (context, allowed) => {
          // Prevent enemy deployment in front of me
          // ... rule logic ...
        }
      }
    }
  ]
}
```

### 4. ShieldTrait

**Purpose:** Damage interception/prevention  
**Examples:** Future cards that give shield

**Configuration:**
```typescript
{
  type: 'shield',
  config: {
    amount: number,
    duration?: 'PERMANENT' | 'THIS_ROUND' | 'UNTIL_DEPLETED'
  }
}
```

**Example Usage:**
```typescript
// Give a unit shield dynamically
unit.addTrait(new ShieldTrait({ amount: 2 }, unit));
```

### 5. ActivateTrait

**Purpose:** Player-activated abilities with cooldowns  
**Examples:** Necromancer (reanimate), Ranger (reposition), Vampire (blood drain)

**Configuration:**
```typescript
{
  type: 'activate',
  config: {
    cooldownMax: number,
    description: string,
    effect: (owner: UnitCard) => Promise<void> | void
  }
}
```

**Example - Vampire (partial):**
```typescript
vampire: {
  name: 'Vampire',
  basePower: 2,
  traits: [
    {
      type: 'activate',
      config: {
        cooldownMax: 1,
        description: 'Blood Drain',
        effect: async (owner) => {
          // Deal 2 damage to close unit
        }
      }
    }
  ]
}
```

### 6. SpecialTrait

**Purpose:** Escape hatch for unique complex mechanics  
**Examples:** Knight (deploy squire token), Mimic (copy power), Priest (cleanse)

**Configuration:**
```typescript
{
  type: 'special',
  hook: 'onDeploy' | 'onDeath' | 'onConquer' | 'onTurnStart',
  implementation: (owner: UnitCard, engine: GameEngine) => Promise<void> | void,
  name?: string
}
```

**Example - Mimic:**
```typescript
mimic: {
  name: 'Mimic',
  basePower: 1,
  traits: [
    {
      type: 'special',
      hook: 'onDeploy',
      name: 'Mimic: Copy Power',
      implementation: async (owner, engine) => {
        const enemyInFront = owner.getUnitInFront();
        if (enemyInFront) {
          const diff = enemyInFront.power - owner.originalPower;
          if (diff !== 0) {
            await owner.addPower(diff);
          }
        }
      }
    }
  ]
}
```

---

## Trait Lifecycle

### Attachment Flow

```
1. CardFactory creates UnitCard
2. CardFactory creates Traits from definitions
3. card.addTrait(trait) called
4. trait.onAttach(card) called
5. Trait subscribes to events (if OngoingReactionTrait)
```

### Execution Flow

```
Unit deployed → engine calls card.onDeploy()
             → card calls trait.onDeploy() for each trait
             → ReactionTrait queues TriggerEffect
             → OngoingReactionTrait starts listening to events
```

### Detachment Flow

```
Unit leaves play → card.onLeave() called
                 → trait.onDetach() for each trait
                 → Unsubscribe from events
                 → Unregister rules
```

---

## Creating New Cards

### Simple Card (Pure ReactionTrait)

```typescript
// Scout: Deploy: Draw a card
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
}
```

### Complex Card (Multiple Traits)

```typescript
// Vampire: Ongoing + Activate
vampire: {
  name: 'Vampire',
  basePower: 2,
  traits: [
    {
      type: 'ongoingReaction',
      config: {
        listenTo: 'UNIT_DAMAGED',
        proximity: 'CLOSE',
        target: 'SELF',
        effect: 'ADD_POWER',
        value: (event) => event.amount || 0
      }
    },
    {
      type: 'activate',
      config: {
        cooldownMax: 1,
        description: 'Blood Drain',
        effect: async (owner) => {
          // Activate logic here
        }
      }
    }
  ]
}
```

---

## Dynamic Trait Application

### The Power of ECS

You can now give abilities to units at runtime!

```typescript
// Future card: "Give close allies Shield(1)"
paladin: {
  name: 'Paladin',
  basePower: 4,
  traits: [
    {
      type: 'reaction',
      config: {
        trigger: 'ON_DEPLOY',
        target: 'CLOSE_ALLY',
        targetDecision: 'ALL',
        effect: 'CUSTOM',
        implementation: async (targets: UnitCard[]) => {
          for (const ally of targets) {
            await ally.addTrait(new ShieldTrait({ amount: 1 }, ally));
          }
        }
      }
    }
  ]
}
```

### Helper Methods

```typescript
class UnitCard {
  // Give shield to this unit
  async giveShield(amount: number): Promise<void> {
    await this.addTrait(new ShieldTrait({ amount }, this));
  }
  
  // Give a reaction ability to this unit
  async giveReaction(config: ReactionConfig): Promise<void> {
    await this.addTrait(new ReactionTrait(config, this));
  }
}
```

---

## Architecture Benefits

### Before (Class-Based)

```typescript
// Had to create new class file for each card
export class Ghoul extends UnitCard {
  async onDeploy(): Promise<void> {
    this.subscribe((event) => {
      if (event.type === 'UNIT_DIED') {
        // ... proximity check ...
        // ... add power logic ...
      }
    });
  }
}

// 25 separate class files
// Repetitive patterns
// Hard to give abilities dynamically
```

### After (ECS)

```typescript
// Data definition
ghoul: {
  name: 'Ghoul',
  basePower: 1,
  traits: [{
    type: 'ongoingReaction',
    config: {
      listenTo: 'UNIT_DIED',
      proximity: 'CLOSE',
      target: 'SELF',
      effect: 'ADD_POWER',
      value: 2
    }
  }]
}

// No class files needed
// Reusable trait implementations
// Dynamic trait application supported
```

---

## Files Structure

```
src/engine/
  traits/
    Trait.ts                    # Base trait class
    ReactionTrait.ts            # Lifecycle triggers
    OngoingReactionTrait.ts     # Event subscriptions
    RuleModifierTrait.ts        # Game rule modifications
    ShieldTrait.ts              # Damage interception
    ActivateTrait.ts            # Cooldown abilities
    SpecialTrait.ts             # Unique mechanics escape hatch
    TraitFactory.ts             # Create traits from configs
  cards/
    Card.ts                     # UnitCard with trait support
    cardDefinitions.ts          # All 25 unit data definitions
    CardFactory.ts              # Create cards from definitions
    index.ts                    # Registry using factory
```

---

## See Also

- [CardSystem.md](./CardSystem.md) - Updated for ECS pattern
- [EffectSystem.md](./EffectSystem.md) - How traits queue effects
- [RulesSystem.md](./RulesSystem.md) - RuleModifierTrait integration
- [CardMechanics.md](../Game%20Design/CardMechanics.md) - Game design rules

