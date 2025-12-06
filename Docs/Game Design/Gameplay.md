# Gameplay

**IMPORTANT: This document is part of the PRIMARY SOURCE of information about how the game functions.**

## The Battlefield

### Layout

**5 Terrains** arranged in a line, facing each other:

```
[0][1][2][3][4] - Player 1
[0][1][2][3][4] - Player 2
```

### Terrain Properties

- **Slots:** Each terrain has one slot per player
  - Your slots = ally slots
  - Opponent's slots = enemy slots
- **Numbering:** Terrains numbered 0-4 for reference
- **One Unit Per Slot:** Maximum one unit per terrain per player

### Positional Terms

**Close**
- Adjacent terrains (directly left OR right)
- Terrain 2's close terrains = 1 and 3
- Terrain 0's close terrain = only 1 (edge)
- Terrain 4's close terrain = only 3 (edge)

**In Front**
- The opposite player's unit on same terrain number
- Your unit at terrain 2 is "in front of" opponent's unit at terrain 2

---

## Turn Structure

### Your Turn Options

**Each turn, the active player must choose ONE:**

1. **Play 1 Card** (Unit OR Action)
   - Play a card from hand
   - Turn passes to opponent
   - You can act again next turn

2. **Activate Abilities** (any/all ready abilities)
   - Activate any Activate abilities with cooldown = 0
   - Can activate multiple in one turn
   - Turn passes to opponent

3. **Declare "Done"**
   - Locked out for rest of skirmish
   - Your units remain on board
   - Cannot take any more actions this skirmish

### Important Rules

**You Must Act to Pass**
- Playing a card or activating abilities = pass turn to opponent
- Doing nothing = declaring "Done" (locked out)
- Cannot "skip" your turn without consequences

**Done Mechanics**
- Once you declare "Done", you cannot act again this skirmish
- Your deployed units remain and compete for terrain control
- Skirmish ends when **both players are done**

---

## Example Turn Sequence

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

---

## Playing Cards

### Unit Cards

**Deployment Rules:**
- Play to any terrain slot (your side)
- One unit per terrain per player maximum

**Replacement Rule:**
- If you already have a unit there, new unit **replaces** it
- Old unit is removed to graveyard (Death triggers)
- New unit takes its place
- New unit's Deploy effects trigger

**Example:**
- You have Scout (2 power) at terrain 1
- You play Champion (5 power) to terrain 1
- Scout dies (Death effects trigger)
- Champion deploys (Deploy effects trigger)

### Action Cards

**Resolution:**
- Play from hand
- Resolve immediately
- Discard to graveyard
- Do not occupy terrains

**Targeting:**
- Can target units or slots
- Some require targets (specified on card)
- Some deploy to terrains like units (e.g., Turret)

---

## Graveyard

### Graveyard Rules

- **Contents:** All discarded/killed cards
- **Persistence:** Graveyard persists between skirmishes
- **Visibility:** Face-up, both players can see contents
- **Interaction:** Some cards interact with graveyard (Necromancer)

### What Goes to Graveyard

- Units that die (power reduced to 0)
- Units replaced by new units
- Action cards after resolving
- Units sacrificed/consumed

---

## Skirmish Resolution

### When Both Players Are Done

**Resolution Sequence:**

**1. Determine Terrain Winners** (compare power at each terrain):
- Your power > Opponent's power → You control
- Your power < Opponent's power → Opponent controls
- Your power = Opponent's power → Nobody controls (tie)
- Empty terrain → Nobody controls

**2. Count Skirmish Points (SP):**
- Each terrain you control = 1 SP
- Most SP = skirmish winner

**3. Trigger Conquer Abilities** (left to right, terrain 0 → 4):
- Units in winning terrains trigger Conquer
- Happens even if you lost the skirmish
- Player 1's Conquer effects first, then Player 2's

**4. Award Skirmish Win:**
- Winner gets 1 match win
- If tied (equal SP), both get 1 match win

**5. Check Match Winner:**
- If any player has 2 match wins → Match over
- If both have 2 match wins → Draw
- Otherwise, start next skirmish

**6. Clean Up:**
- All units removed to graveyard
- All slot modifiers removed
- Hands remain as-is
- Graveyard persists
- Winner draws 3 cards, loser draws 3 cards

---

## Resolution Example

**Final Board State:**
```
Terrain:     [0]  [1]  [2]  [3]  [4]
Player 1:    [5]  [3]  [ ]  [2]  [4]
Player 2:    [3]  [3]  [6]  [ ]  [4]
```

**Step 1: Determine Winners**
- Terrain 0: P1 (5 > 3) ✓
- Terrain 1: Tie (3 = 3)
- Terrain 2: P2 (6 > 0) ✓
- Terrain 3: P1 (2 > 0) ✓
- Terrain 4: Tie (4 = 4)

**Step 2: Count SP**
- P1: 2 SP (terrains 0, 3)
- P2: 1 SP (terrain 2)

**Step 3: Trigger Conquer**
- P1's units at terrains 0 and 3 trigger Conquer
- P2's unit at terrain 2 triggers Conquer

**Step 4: Award Win**
- P1 wins skirmish (2 SP > 1 SP)

---

## Priority Flow

### After Playing Card or Activating
- Priority passes to opponent
- They can now take their turn

### After Declaring Done
- Priority passes to opponent
- They can keep playing until they also declare "Done"
- You cannot act anymore

### After Both Done
- Skirmish resolves immediately
- No more turns taken

---

*For card abilities and keywords, see [CardMechanics.md](./CardMechanics.md)*
*For complete card list, see [CardCatalog.md](./CardCatalog.md)*
