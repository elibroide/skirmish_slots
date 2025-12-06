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
- Activating abilities counts as your turn action

**Example:** "Activate (Cooldown 1): Deploy a dead ally with power 3 or less"

**Cooldown Timing:**
- Cooldown 1 = can activate on your next turn
- Cooldown 2 = can activate 2 turns later
- Cooldown 0 = ready to activate now

---

### Conquer

**Trigger:** When unit's terrain is won (you have higher power)
**Timing:** Happens during skirmish resolution AFTER winners determined

**Example:** "Conquer: Draw 2 cards"

**Important Details:**
- Triggers even if you lost the skirmish overall
- Only cares if THIS unit's terrain was won
- Triggers in order: terrain 0 → 4, P1 first then P2

**Example:**
- You lose skirmish 2-3
- But your Noble won terrain 2
- Noble's Conquer still triggers (draw 2 cards)

---

### Consume

**Trigger:** Remove one of YOUR units from play to get benefit

**Mechanics:**
- You choose to consume your own unit
- Consumed unit goes to graveyard
- Some units have benefits when consumed (Consumed keyword)
- Some cards require consuming to play (Dragon)

**Example Uses:**
- "Can only be deployed by consuming another unit" (Dragon)
- "Consume: Draw a card" (Apprentice)
- "Consumed: Consuming unit gets +3" (Acolyte)

**Consume vs Death:**
- Consume is voluntary (you choose)
- Death triggers when consumed

---

### Death

**Trigger:** When unit is removed from play for any reason

**Causes of Death:**
- Power reduced to 0 (damage)
- Replaced by new unit
- Consumed
- Removed by effects

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
- Damage is permanent for the skirmish

**Example:** "Deal 2 damage to a close enemy"

**Result:**
- Enemy with 4 power → now has 2 power
- Enemy with 2 power → now has 0 power (dies)

---

### Give/Get +X Power

**Effect:** Increases unit's power by X

**Rules:**
- Lasts for remainder of skirmish (not permanent)
- Stacks with other buffs
- Clears at end of skirmish

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

**Definition:** Adjacent terrains (directly left OR right)

**Examples:**
- Terrain 2's close terrains = 1 and 3
- Terrain 0's close terrain = only 1 (edge)
- Terrain 4's close terrain = only 3 (edge)

**Usage:** "Deal 1 damage to close enemies"

---

### In Front

**Definition:** The opposite player's unit on same terrain number

**Example:**
- Your unit at terrain 2 is "in front of" opponent's unit at terrain 2

**Usage:**
- "My power = enemy in front of me" (Mimic)
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

## Reserved Mechanics

**Note:** These mechanics exist in the codebase but are not currently used by any V2 cards. They are reserved for future card designs.

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
