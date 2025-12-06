# Skirmish - Game Design Document

**IMPORTANT: This document is the PRIMARY SOURCE of information about how the game functions. Any and every discrepancy between this document and other documentation or code should be fixed to match this document, or at minimum questioned and clarified.**

## Overview
A 2-player tactical card game where players deploy units and play maneuvers across five terrains, competing to win skirmishes through strategic positioning and resource management.

---

## Core Game Structure

### Victory Conditions
- **Match Format:** Best of 3 skirmishes
- **Match Winner:** First player to win 2 skirmishes
- **Special Cases:** 
  - Tie skirmish = both players get 1 win
  - If both players reach 2 wins via ties (1-1 after 2 tied skirmishes) = Draw game
  - Otherwise play decisive skirmish

### Skirmish Victory
- **Terrain Control:** Player controlling more terrains wins the skirmish
- **Winning a Terrain:** Your unit has higher power than opponent's (or opponent has no unit)
- **Ties:** Equal power = nobody controls that terrain (doesn't count for either player)
- **Empty Terrains:** No units on either side = nobody controls (doesn't count)
- **Example:** P1 controls 3 terrains, P2 controls 2 → P1 wins skirmish

### Skirmish Points (SP)
- Each terrain you control at skirmish end = 1 SP
- Used for tracking and card effects (like Conquer: "when I win a terrain")
- Player with most SP wins the skirmish

---

## Game Setup

### Deck Construction Rules
- **Deck Size:** 20-30 cards (recommended: start with 20)
- **Copy Limit:** Max 2-3 copies of any single card (playtesting will determine final number)
- **Card Types:** Unit cards and Action cards

### Skirmish Start
1. **First Skirmish:** Each player draws 8 cards from their deck
2. **Subsequent Skirmishes:** Each player draws 3 additional cards from their deck
3. **No Hand Size Limit:** Players keep all cards drawn
4. **Mulligan Phase:** Not implemented in MVP (future feature)

---

## Gameplay

### The Battlefield

**5 Terrains** arranged in a line, facing each other:

```
[0][1][2][3][4] - Player 1
[0][1][2][3][4] - Player 2
```

- Each terrain has one **slot per player**, ally slots for the player and enemy slots for the opponent
- Terrains are numbered 0-4 for reference
- **Close** = adjacent terrains (0-1, 1-2, 2-3, 3-4)
- **In front** = opposite player's unit on same terrain number

### Turn Structure

**Each turn, the active player must either:**
1. **Play 1 card** (Unit OR Action) → Turn passes to opponent
2. **Activate abilities** (any/all ready Activate abilities) → Turn passes to opponent
3. **Declare "Done"** → Locked out for rest of skirmish

**Important: You must DO something to pass the turn!**
- If you play a card or activate abilities, turn passes to opponent (you can act again next turn)
- If you do nothing, you're declaring "Done" (locked out for this skirmish)
- You cannot "skip" your turn without consequences

**Done Mechanics:**
- Once you declare "Done", you cannot act again this skirmish
- Your deployed units remain and compete for terrain control
- Skirmish ends when **both players are done**

**Turn Order:**
- Starting player determined randomly for Skirmish 1
- After that, player who LOST previous skirmish goes first
- If tied skirmish, starting player alternates

**Example Turn Sequence:**
```
P1: Plays Knight to terrain 2 → P2's turn
P2: Plays Veteran to terrain 3 → P1's turn
P1: Activates Ranger (moves to terrain 1) → P2's turn
P2: Plays Energize on Veteran → P1's turn
P1: "I'm done" (locked out)
P2: Plays Champion to terrain 0 → P1 is done, P2's turn again
P2: "Done" (locked out)
→ Both done, skirmish resolves
```

### Playing Cards

**Unit Cards:**
- Play to any terrain slot
- If you already have a unit there, the new unit **replaces** it to consume it
  - Old unit is removed to graveyard
  - New unit takes its place
  - New unit's Deploy effects trigger
- One unit per terrain per player maximum

**Action Cards:**
- Play from hand, resolve immediately, then discard to graveyard
- Do not occupy terrains
- Can target units or slots
- Some Actions (like Turret) deploy to terrains like units

**Graveyard:**
- All discarded/killed cards go to graveyard
- Graveyard persists between skirmishes
- Face-up, both players can see contents

### Skirmish Resolution

**When both players are done:**

1. **Determine terrain winners** (compare power at each terrain):
   - Your power > Opponent's power → You control
   - Your power < Opponent's power → Opponent controls
   - Your power = Opponent's power → Nobody controls (tie)
   - Empty terrain → Nobody controls

2. **Count Skirmish Points (SP)**:
   - Each terrain you control = 1 SP
   - Most SP = skirmish winner

3. **Trigger Conquer abilities** (left to right, terrain 0 → 4):
   - Units in winning terrains trigger Conquer
   - Happens even if you lost the skirmish
   - Player 1's Conquer effects first, then Player 2's

4. **Award skirmish win**:
   - Winner gets 1 match win
   - If tied (equal SP), both get 1 match win

5. **Check match winner**:
   - If any player has 2 match wins → Match over
   - If both have 2 match wins → Draw
   - Otherwise, start next skirmish

6. **Clean up**:
   - All units removed to graveyard
   - All slot modifiers removed
   - Hands remain as-is
   - Graveyard persists

---

## Card Types & Keywords

### Unit Cards
- Have base power value
- Deploy to terrains
- Can have Deploy, Death, Consumed, Conquer, or Activate abilities

### Action Cards
- One-time effects
- Played from hand, resolve, then discarded
- Can manipulate board, deal damage, buff units, etc.

---

## Effect Keywords & Mechanics

### Timing Keywords

**Deploy**
- Triggers when unit enters play
- Happens immediately when played
- Example: "Deploy: Deal 2 damage to a close enemy"

**Activate (Cooldown X)**
- One-time ability that requires waiting
- When unit is deployed, cannot activate yet
- At start of each of your turns, reduce cooldown by 1
- When cooldown reaches 0, you may activate (once ever)
- Can activate multiple units' abilities in one turn
- Example: "Activate (Cooldown 1): Deploy a dead ally with power 3 or less"

**Conquer**
- Triggers when unit's terrain is won (you have higher power)
- Happens during skirmish resolution AFTER winners determined
- Triggers even if you lost the skirmish overall
- Example: "Conquer: Draw 2 cards"

**Consume**
- Remove one of YOUR units from play to get benefit
- Consumed unit goes to graveyard
- Some units have benefits when consumed
- Example: "Can only be deployed by consuming another unit" (Dragon)
- Example: "Consume: Draw a card" (Apprentice)
- Example: "Consumed: Consuming unit gets +3" (Acolyte)

**Death**
- Triggers when unit is removed from play for any reason
- Includes: replacement, damage to 0, removal by effects
- Example: "Death: My slot gets +X modifier equal to my power" (Roots)

---

### Power Modification

**Deal X damage**
- Reduces unit's power by X
- Power cannot go below 0
- If reduced to 0, unit dies (Death triggers)
- Example: "Deal 2 damage to a close enemy"

**Give/Get +X power**
- Increases unit's power by X
- Lasts for remainder of skirmish (not permanent)
- Stacks with other buffs
- Example: "Close allies get +1"

**Wounded**
- A unit that has taken damage (current power < base power)
- Example: "Kill a close wounded unit" (Hunter)

---

### Slot Modifiers

**Format:** "My slot gets +X" or "Give a slot +X"

- **Each player's slot** can have power modifiers (not the entire terrain)
- When a unit is on that slot, it gets the modifier added to its power
- Modifiers are permanent until skirmish ends
- Multiple modifiers stack
- **Cleared at end of skirmish**
- Example: Engineer (1): "On your turn start, my slot gets +1"
- Example: Roots (2): "Death: My slot gets +X modifier equal to my power"

---

### Positional Terms

**Close**
- Adjacent terrains (directly left OR right)
- Terrain 2's close terrains = 1 and 3
- Terrain 0's close terrain = only 1 (edge)
- Terrain 4's close terrain = only 3 (edge)
- Example: "Deal 1 damage to close enemies"

**In front**
- The opposite player's unit on same terrain number
- Your unit at terrain 2 is "in front of" opponent's unit at terrain 2
- Example: "My power = enemy in front of me" (Mimic)
- Example: "Deal 1 damage to enemy in front of me" (Turret)

**All**
- Every unit/terrain in category
- Example: "Deal 2 damage to all enemies"

---

### Targeting

**An ally / ally**
- One of your units
- Example: "Give an ally +3"

**An enemy / enemy**
- One of opponent's units
- Example: "Deal 3 damage to an enemy"

**A unit / unit**
- Any unit (yours or opponent's)
- Example: "Return a unit to hand"

**A slot / slot**
- Any terrain slot
- Can be yours or opponent's
- Example: "Choose a slot, deal 2 damage to unit on it and close units" (Fireball)

**IMPORTANT: Slots belong to players!**
- Each terrain has 2 slots: **your slot** and **opponent's slot**
- "Your slot" = the slot on your side of that terrain
- "Opponent's slot" = the slot on their side of that terrain
- Units are "allies" (yours) or "enemies" (opponent's)
- Slots are "yours" or "opponent's"

---

### Area Effects

**Close units**
- Units on adjacent terrains
- Can be allies, enemies, or both
- Example: Fireball targets a slot, damages unit there AND close units (both yours and opponent's)

**All allies**
- All your units on battlefield
- Example: "All allies get +1"

**All enemies**
- All opponent's units on battlefield
- Example: "Deal 1 to all enemies"

---

### Additional Mechanics (Future Use)

These mechanics exist in the codebase but are not currently used by any V2 cards. They are reserved for future card designs:

**Bounce**
- Returns a unit to its owner's hand
- Unit card goes back to hand (not graveyard)
- Example: "Bounce a close unit to its owner's hand"

**Heal**
- Restores a unit's power up to its original value
- Cannot heal above original power
- Example: "Heal a close ally for 3"

---

## Card List

### Units

**Acolyte (1)**
- Consumed: Consuming unit gets +3

**Apprentice (3)**
- Consume: Draw a card

**Archer (3)**
- Deploy: Deal 2 damage to a close enemy

**Bard (2)**
- When your turn starts, close allies get +1

**Champion (5)**
- (Pure stats, no ability)

**Dragon (7)**
- Can only be deployed by consuming another unit

**Engineer (1)**
- On your turn start, my slot gets +1

**Ghoul (1)**
- When a close unit dies, I get +2

**Hunter (4)**
- Deploy: Kill a close wounded unit

**Knight (3)**
- Deploy: You may deploy a Squire to your close slot (Squire is 1 power)

**Mimic (1)**
- Deploy: My power becomes equal to enemy in front of me

**Necromancer (2)**
- Activate (Cooldown 1): Deploy a dead ally with power 3 or less

**Noble (4)**
- Conquer: Draw 2 cards

**Priest (2)**
- Deploy: Cleanse a close slot (remove all abilities and buffs from unit and slot)

**Ranger (4)**
- Activate: Move me to your close slot (switch positions if occupied)

**Rogue (2)**
- This terrain is won by lowest power instead of highest

**Rookie (3)**
- Activate (Cooldown 2): My slot and a close slot get +2

**Roots (2)**
- Death: My slot gets +X modifier equal to my power

**Scout (2)**
- Deploy: Draw a card

**Sentinel (3)**
- An enemy cannot be deployed in front of me

**Turret (3)**
- When your turn starts, deal 1 damage to enemy in front of me

**Vampire (2)**
- When a close unit is dealt damage, I gain that much power
- Activate (Cooldown 1): Deal 2 damage to a close unit

**Veteran (4)**
- (Pure stats, no ability)

**Warlock (3)**
- Consume: Deal damage to a close enemy equal to consumed unit's power

**Wizard (3)**
- When you play an action, my slot gets +2

---

### Actions

**Assassinate**
- Kill an enemy with power 5 or greater

**Energize**
- An ally gets +3

**Fireball**
- Choose a slot, deal 2 damage to unit on it and each close unit
- **WARNING: Damages your units too if they're close!**

**Repositioning**
- Move a unit to a close slot of same player (switch positions if occupied)

**Seed**
- Give a slot and close slots +1

**Strike**
- Deal 3 damage to a unit

**Unsummon**
- Return a unit to hand

---

## Strategy Notes

### Resource Management
- Cards in hand are your only resource
- Passing early saves cards for next skirmish
- Consume converts units into effects

### Terrain Priority
- You only need to win 3 out of 5 terrains
- Can concede weak terrains to conserve cards
- Focus power where it matters

### Slot Modifiers
- Build up key terrains with slot modifiers
- Clear between skirmishes (don't persist!)
- Stack multiple modifiers for big power swings

### Conquer Strategy
- Noble is key for card advantage
- Conquer triggers even if you lose skirmish
- Sacrifice 2 terrains to win 3 (with Noble draws)

### Consume Synergies
- Acolyte makes all consume stronger (+3)
- Dragon requires consume (7 power for 2 cards)
- Warlock converts low units into damage

### Passing Dynamics
- Declare "Done" when ahead to lock in advantage
- Declare "Done" when behind to save cards
- Force opponent to overcommit by going "Done" early

---

## Common Timing Questions

**Q: When does Engineer's ability trigger?**
A: At START of your turn, before you play a card.

**Q: Can I activate multiple abilities in one turn?**
A: Yes! Activate as many ready abilities as you want.

**Q: Does Fireball damage my own units?**
A: YES! It damages ALL units close to the target (yours and opponent's).

**Q: If I lose the skirmish but my Noble won its terrain, does Conquer trigger?**
A: YES! Conquer cares about the terrain, not the skirmish.

**Q: What happens if both players tie for SP?**
A: Both players get 1 match win. If both reach 2 wins this way, it's a draw.

**Q: Can I skip my turn to pass it to my opponent?**
A: NO! You must play a card or activate abilities to pass the turn. If you do nothing, you're declaring "Done" and locked out.

**Q: If I'm done, can my opponent keep playing?**
A: Yes! They can play as many turns as they want until they also declare "Done".

**Q: Do slot modifiers carry over between skirmishes?**
A: NO! Everything clears (units and slot modifiers). Only graveyard and hands persist.

**Q: Can I deploy a unit to a terrain where I already have one?**
A: Yes! The new unit replaces the old one (old one dies).

**Q: When does Bard's ability trigger?**
A: At START of your turn, close allies get +1. This happens every turn Bard survives.

---

## Design Philosophy

### Core Pillars
1. **Spatial tactics** - Positioning matters (close, in front)
2. **Resource tension** - Cards are precious, passing is strategic
3. **Meaningful sacrifice** - Consume creates tough choices
4. **Clean resolution** - Everything clears, fresh start each skirmish
5. **Comeback potential** - Conquer and card advantage enable recovery

### What Makes This Unique
- Gwent-style passing with spatial positioning
- Consume mechanic creates sacrifice decisions
- Conquer rewards winning individual battles
- 5 terrains means majority is 3 (clear goal)
- Slot modifiers add tactical depth without persistence

---

*Version 2.0 - Updated with Skirmish system and current mechanics*