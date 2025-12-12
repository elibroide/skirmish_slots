# Card Mechanics

**IMPORTANT: This document is part of the PRIMARY SOURCE of information about how the game functions.**

## Card Types

### Unit Cards
- Have base power value
- Deploy to terrains
- Can have Deploy, Death, Consumed, Conquer, or Activate abilities
- Compete for terrain control

### Action Cards
- One-time effects
- Played from hand, resolve, then discarded
- Can manipulate board, deal damage, buff units, etc.
- Do not occupy terrains (except special cases like Turret)

---

## Timing Keywords

### Deploy

**Trigger:** When unit enters play
**Timing:** Happens immediately when played

**Example:** "Deploy: Deal 2 damage to a close enemy"

**Details:**
- Triggers after unit is placed on terrain
- Happens before any other effects
- Can target units, slots, or players

---

### Activate (Cooldown X)

**Trigger:** One-time ability that requires waiting

**Mechanics:**
- When unit is deployed, cannot activate yet
- At start of each of your turns, reduce cooldown by 1
- When cooldown reaches 0, you may activate (once ever)
- Can activate multiple units' abilities in one turn
- **Activating abilities are Quick Actions** (do not pass priority automatically)

**Example:** "Activate (Cooldown 1): Deploy a dead ally with power 3 or less"

**Cooldown Timing:**
- Cooldown 1 = can activate on your next turn
- Cooldown 2 = can activate 2 turns later
- Cooldown 0 = ready to activate now

---

### Conquer (M2 Rework)

**Type:** Passive keyword (no trigger effect)
**Function:** SP bonus when winning a lane

**Mechanics:**
- Base lane win = 1 SP
- Lane win with Conquer unit = 2 SP (base + bonus)
- Only the winning unit matters (if multiple units had Conquer via replacement, only final winner counts)

**Strategic Value:**
- Units with Conquer are high-value targets
- Worth protecting if you control the lane
- Worth targeting if enemy controls the lane
- Adds 1 extra SP per won lane with Conquer

**Example:**
- You win terrain 2 with a unit that has Conquer
- Base SP for terrain 2: 1 SP
- Conquer bonus: +1 SP
- Total for that lane: 2 SP

---

### Consume

**Definition:** Deploying a unit on top of one of your existing units

**Mechanics:**
- Consume is the **exception** to the "empty slots only" deploy rule
- Units with Consume CAN deploy to slots you already occupy
- The existing unit is sacrificed (removed to graveyard)
- The new unit takes its place
- Death effects trigger on the consumed unit
- Consumed effects trigger if the sacrificed unit has them

**Consume Flow:**
1. Select a unit with Consume ability
2. Target one of YOUR occupied slots
3. Existing unit is removed to graveyard (Death triggers)
4. If consumed unit has "Consumed:" effect, it triggers
5. New unit deploys to that slot (Deploy triggers)

**Example Uses:**
- "Can only be deployed by consuming another unit" (Dragon - requires consume)
- "Consume: Draw a card" (Apprentice - optional consume for benefit)
- "Consumed: Consuming unit gets +3" (Acolyte - benefit when sacrificed)

**Types of Consume:**
- **Required Consume:** Unit MUST consume to deploy (e.g., Dragon)
- **Optional Consume:** Unit CAN consume for a benefit (e.g., Apprentice)

**Consume vs Death:**
- Consuming IS a form of death (Death triggers)
- "Consumed:" is an additional trigger only when consumed (not other deaths)

---

### Death

**Trigger:** When unit is removed from play for any reason

**Causes of Death:**
- Power reduced to 0 (damage)
- Consumed (another unit deployed on top)
- Removed by effects (kill, destroy, etc.)

**Example:** "Death: My slot gets +X modifier equal to my power" (Roots)

**Timing:**
- Death effects trigger immediately when unit dies
- Happen before any further effects resolve

---

### Consumed

**Trigger:** When this unit is consumed (voluntary sacrifice)

**Example:** "Consumed: Consuming unit gets +3" (Acolyte)

**Details:**
- Only triggers when consumed (not other deaths)
- Benefit usually goes to consuming unit
- Creates synergy with Consume effects

---

## Power Modification

### Deal X Damage

**Effect:** Reduces unit's power by X

**Rules:**
- Power cannot go below 0
- If reduced to 0, unit dies (Death triggers)
- Damage persists while unit is on the battlefield
- **Damage does NOT persist if unit leaves the battlefield**
  - Bounced units return to hand at full base power
  - Redeployed units (e.g., from graveyard) enter at base power

**Example:** "Deal 2 damage to a close enemy"

**Result:**
- Enemy with 4 power → now has 2 power
- Enemy with 2 power → now has 0 power (dies)

**Leaving Battlefield:**
- Unit with 3/5 power gets bounced → returns to hand as 5 power card
- Unit with 3/5 power gets redeployed from graveyard → enters as 5 power

---

### Give/Get +X Power

**Effect:** Increases unit's power by X

**Rules:**
- Lasts for remainder of skirmish (not permanent)
- Stacks with other buffs
- Clears at end of skirmish
- Buffs do not carry over if unit is moved out of the battlefield

**Example:** "Close allies get +1"

**Result:**
- Ally with 3 power → now has 4 power
- Buff lasts until skirmish ends

---

### Wounded

**Condition:** A unit that has taken damage

**Definition:** Current power < base power

**Example:** "Kill a close wounded unit" (Hunter)

**Details:**
- Unit must have taken damage to be wounded
- Buffed units are not wounded (unless also damaged)
- Example: 3-power unit takes 1 damage = wounded (2/3)
- Example: 3-power unit gets +2 buff = not wounded (5/3)

---

## Slot Modifiers

### Format

**Notation:** "My slot gets +X" or "Give a slot +X"

**Ownership:**
- Each player's slot can have power modifiers
- Modifier belongs to the player, not the terrain
- "My slot" = your side of that terrain
- Modifiers can be negative

---

### Mechanics

**Application:**
- When a unit is on that slot, it gets the modifier added to its power
- Modifiers are permanent until skirmish ends
- Multiple modifiers stack additively
- **Cleared at end of skirmish**

**Example:** Engineer (1): "On your turn start, my slot gets +1"
- Turn 1: Slot has +1
- Turn 2: Slot has +2
- Turn 3: Slot has +3
- Unit deployed there has power + (slot modifier)

**Example:** Roots (2): "Death: My slot gets +X modifier equal to my power"
- Roots (2 power) dies
- Slot gets +2 modifier
- Next unit deployed there gets +2 power

---

### Stacking

**Multiple Sources:**
- Engineer gives +1 each turn
- Roots dies, gives +2
- Total slot modifier: +3
- Unit deployed there gets +3 additional power

---

## Positional Terms

### Close

**Definition:** Adjacent terrains (directly left OR right) and the one in front

**Examples:**
- Terrain 2's close terrains = 1 and 3
- Terrain 0's close terrain = only 1 (edge)
- Terrain 4's close terrain = only 3 (edge)

**Usage:** "Deal 1 damage to close enemies"

Exmple of close to Me
[No][Ye][Ye][Ye][No]
[No][Ye][Me][Ye][No]

---

### In Front (or Opposing)

**Definition:** The opposite player's unit on same terrain number

**Example:**
- Your unit at terrain 2 is "in front of" opponent's unit at terrain 2

**Usage:**
- "My power = to opposing enemy" (Mimic)
- "Deal 1 damage to enemy in front of me" (Turret)

---

### All

**Definition:** Every unit/terrain in category

**Usage:**
- "Deal 2 damage to all enemies"
- "All allies get +1"

---

## Targeting

### An Ally / Ally

**Definition:** One of your units

**Example:** "Give an ally +3"

**Details:**
- Must target your own unit
- Cannot target opponent's units

---

### An Enemy / Enemy

**Definition:** One of opponent's units

**Example:** "Deal 3 damage to an enemy"

**Details:**
- Must target opponent's unit
- Cannot target your own units

---

### A Unit / Unit

**Definition:** Any unit (yours or opponent's)

**Example:** "Return a unit to hand"

**Details:**
- Can target any unit on board
- Includes both allies and enemies

---

### A Slot / Slot

**Definition:** Any terrain slot

**Important:** **Slots belong to players!**
- Each terrain has 2 slots: **your slot** and **opponent's slot**
- "Your slot" = the slot on your side of that terrain
- "Opponent's slot" = the slot on their side of that terrain
- Units are "allies" (yours) or "enemies" (opponent's)
- Slots are "yours" or "opponent's"

**Example:** "Choose a slot, deal 2 damage to unit on it and close units" (Fireball)

**Details:**
- Can target any slot (yours or opponent's)
- May target empty slots
- Effects may damage unit on slot (if any)

---

## Area Effects

### Close Units

**Definition:** Units on adjacent terrains

**Includes:** Can be allies, enemies, or both

**Example:** Fireball targets a slot, damages unit there AND close units
- Damages YOUR units if they're close
- Damages OPPONENT'S units if they're close

**Warning:** Area effects can hurt your own units!

---

### All Allies

**Definition:** All your units on battlefield

**Example:** "All allies get +1"

---

### All Enemies

**Definition:** All opponent's units on battlefield

**Example:** "Deal 1 to all enemies"

---

## Quick Actions & Turn Flow

### Action Types

| Action Type | Limit | Examples |
|-------------|-------|----------|
| **Normal Action** | Once per turn | Play a card from hand |
| **Quick Action** | Any number | Activate unit abilities, use Leader abilities, play cards marked as "Quick" |
| **Pass** | Ends your turn | See below |

### How Passing Works

When you click **Pass**:
- **If you performed any action this turn** → Priority moves to opponent, you may act again later
- **If you performed NO actions this turn** → You are **Done** for the skirmish (locked out)

---

## M2 New Keywords

### Shield

**Type:** Defensive stat (similar to Power)
**Function:** Damage reduction layer that protects Power

**Mechanics:**
- Units have Power/Shield format: "5/2" = 5 power, 2 shield
- Shield absorbs damage before Power is affected
- When damage is dealt to a unit with Shield:
  1. If Shield ≥ Damage → Shield reduced by Damage, Power unaffected
  2. If Damage > Shield → Shield reduced to 0, overflow damage hits Power

**Damage Calculation:**
```
if (shield >= damage) {
  shield -= damage;
  // Power stays the same
} else {
  overflow = damage - shield;
  shield = 0;
  power -= overflow;
}
```

**Example:**
- Unit has 5 Power, 2 Shield (displayed as 5/2)
- Takes 3 damage
- Shield absorbs 2 (Shield → 0)
- Overflow of 1 hits Power (Power → 4)
- Result: 4 Power, 0 Shield (4/0)

**Shield Granting:**
- Cards can grant Shield: "Deploy: Shield 2" (gives self 2 Shield)
- "Give close allies Shield 1" (grants Shield to nearby units)
- Shield stacks (if you have 2 Shield and gain 2 more, you have 4)

**Visual:**
- Shield displayed separately from Power on card
- Shield icon with value
- Shield bar/indicator on board frame

---

### Dominant

**Type:** Conditional passive ability
**Trigger:** Active only when unit is LEADING its lane

**Definition:**
- A unit is **Dominant** when its Power > opposing enemy's Power in the same lane
- "Dominant: [Effect]" abilities only work while the unit is leading

**Mechanics:**
- Dominant status checked after every power change in lane
- Updates dynamically as power changes
- Only active when strictly greater (ties don't count)
- If no enemy in lane, unit is Dominant (leading by default)

**Example Effects:**
- "Dominant: Actions you play deal +2 damage"
- "Dominant: Close allies get +1 Power"
- "Dominant: This unit has Shield 2"
- "Dominant: At end of turn, deal 1 damage to a far enemy"

**Visual:**
- Crown or glow icon above unit when Dominant
- Dominant keyword icon is highlighted/glowing when active
- Icon grayed out when not leading

**Strategic Implications:**
- Creates lane control objectives
- Encourages fighting for specific terrains
- Power swings can turn Dominant on/off mid-skirmish

---

### Move

**Type:** Action/Ability keyword
**Function:** Repositioning units on the battlefield

**Definition:**
- Move changes a unit's slot position
- Typically to adjacent (close) empty slots
- Does NOT trigger Deploy effects (unless specified)

**Move Rules:**
- Can only move to **empty** slots (respects deploy restrictions)
- Typically limited to **close** slots (adjacent terrains)
- Moving is an action that can be granted by:
  - Unit activated abilities: "Activate: Move to a close empty slot"
  - Card effects: "Deploy: Move a close ally to an empty slot"
  - Leader abilities: "Move a unit to a close empty slot"

**Move vs Deploy:**
- Moving does NOT trigger Deploy effects (pure repositioning)
- Exception: Some cards may specify "Move, triggering Deploy"
- Moving does NOT cost cards (repositioning only)

**Example Abilities:**
- "Activate: Move this unit to a close empty slot"
- "Deploy: Move a close ally to an empty slot"
- "Activated (1 charge): Move a unit to a close empty slot" (Leader)

**Strategic Uses:**
- Dodge bad matchups (move away from counter unit)
- Set up positional synergies (move into range of "close ally" buffs)
- Fill empty slots strategically
- React to opponent's deployment

---

### Bounce

**Effect:** Returns a unit to its owner's hand

**Details:**
- Unit card goes back to hand (not graveyard)
- Can be replayed later
- Fresh instance when replayed (no damage/buffs)

**Example:** "Bounce a close unit to its owner's hand"

---

### Heal

**Effect:** Restores a unit's power up to its original value

**Details:**
- Cannot heal above original power
- Only restores damage taken
- Does not remove buffs

**Example:** "Heal a close ally for 3"
- Ally with 2/5 power heals → 5/5 power
- Ally with 5/5 power heals → still 5/5 (no effect)

---

*For card implementations, see [CardSystem.md](../Code%20Architecture/CardSystem.md)*
*For complete card list, see [CardCatalog.md](./CardCatalog.md)*
