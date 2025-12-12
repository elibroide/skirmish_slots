# Core Rules

**IMPORTANT: This document is part of the PRIMARY SOURCE of information about how the game functions. Any discrepancies between this document and other documentation or code should be fixed to match the Game Design documentation.**

## Match Format

**Best of 3 Skirmishes**
- First player to win 2 skirmishes wins the match
- Players compete across 5 terrains to control the majority

---

## The Battlefield

**5 Terrains** arranged in a line, facing each other:

```
[0][1][2][3][4] - Player 1
[0][1][2][3][4] - Player 2
```

- Each terrain has one **slot per player** (your slot vs opponent's slot)
- Terrains are numbered 0-4 for reference
- **One unit per slot** maximum

### Positional Terms
- **Close** = adjacent terrains (0↔1, 1↔2, 2↔3, 3↔4) + the slot in front
- **In front** = opposite player's slot on same terrain number

---

## Victory Conditions

### Skirmish Victory
- **Win Condition:** Have more SP (Skirmish points) then your opponents
- **Terrain Control:** Your unit has higher power than opponent's (or opponent has no unit)
- **Ties:** Equal power = nobody controls that terrain (doesn't count for either player)
- **Empty Terrains:** No units on either side = nobody controls (doesn't count)

**Example:**
- P1 controls 3 terrains, P2 controls 2 → P1 wins skirmish

### Special Cases

**Tie Skirmish:**
- If both players control equal number of terrains = **both get 1 win**

**Draw Game:**
- If both players reach 2 wins via ties (1-1 after 2 tied skirmishes) = **Draw game**
- Example: Skirmish 1 ties (1-1), Skirmish 2 ties (2-2) → Draw

**Decisive Skirmish:**
- Otherwise, play until one player has 2 wins
- Example: Win-Tie-Win = 2 wins, match over

---

## Skirmish Points (SP)

### What Are Skirmish Points?

- **Scoring:** Each terrain you control at skirmish end = 1 SP (base)
- **Purpose:** Used for tracking and determining skirmish winner
- **Winner Determination:** Player with most SP wins the skirmish

### Conquer Keyword (SP Bonus)
- **Conquer** is a keyword on specific units
- When a unit with Conquer **wins its lane**, the player gains +1 bonus SP
- Base 1 SP + Conquer 1 SP = 2 SP total for that lane

**Example:**
- You control terrains 1, 2, and 4 = 3 SP base
- Your unit at terrain 2 has Conquer = +1 SP bonus
- Total: 4 SP
- Opponent controls terrains 0 and 3 = 2 SP
- You win with 4 SP vs 2 SP

---

## Deck Construction Rules

### Deck Size
- **Minimum:** 25 cards
- **Maximum:** 30 cards
- **Recommended:** Start with 25 cards for new players

### Card Types
- **Unit Cards:** Deploy to terrains, have power
- **Action Cards:** One-time effects, played from hand

### Rarity System

**Card Rarities:**
- **Bronze:** Common cards, backbone of decks
- **Silver:** Uncommon cards, synergy pieces and build-arounds
- **Gold:** Rare cards, unique and powerful effects

**Rarity Limits per Deck:**
- **Bronze:** Unlimited (within copy limit)
- **Silver:** Maximum 7 cards total
- **Gold:** Maximum 4 cards total

### Copy Limit
- **Max Copies:** Up to 3 copies for Bronze, 2 copies for Silver and 1 copy for Gold.

**Visual Identification:**
- Bronze = copper/bronze border
- Silver = silver border
- Gold = gold border with shimmer effect

---

## Skirmish Start

### First Skirmish
**Draw 8 cards** from your deck
- This is your starting hand
- No mulligan phase in MVP (future feature)

### Subsequent Skirmishes
**Draw 4 additional cards** from your deck
- Add to your existing hand
- No hand size limit

### No Hand Size Limit
- **Keep All Cards:** Players keep all cards drawn throughout the match
- Cards stay in hand between skirmishes
- Only removed when played or discarded

---

## Game Setup Sequence

1. **Build Decks:** Each player constructs a 25-30 card deck
2. **Shuffle Decks:** Shuffle your deck thoroughly
3. **Determine Starting Player:** Random for first skirmish
4. **Draw Opening Hands:** Each player draws 8 cards
5. **Begin Play:** Starting player takes first turn

---

## Between Skirmishes

### What Persists
- **Your Hand:** All unplayed cards remain in hand
- **Your Deck:** Remaining cards stay in deck order
- **Graveyard:** All discarded/killed cards remain in graveyard
- **Match Score:** Skirmish wins carry over
- **Special** Some units and effects have "permanent" abilties that makes them stay

### What Clears
- **All Units:** Removed from terrains to graveyard
- **Slot Modifiers:** All power modifiers cleared
- **Turn State:** Pass status resets

---

## Turn Order Rules

### First Skirmish
- **Random:** Determined randomly
- Both players have equal chance to start

---

## Turn Structure (Manual Pass System)

### Your Turn Actions

On your turn, you can perform the following actions:

| Action Type | Limit | Examples |
|-------------|-------|----------|
| **Normal Action** | Once per turn | Play a card from hand |
| **Quick Action** | Any number | Activate unit abilities, use Leader abilities, play cards marked as "Quick" |
| **Pass** | Ends your turn | See below |

### How Passing Works

When you click **Pass**:
- **If you performed any action this turn** → Priority moves to opponent, you may act again later
- **If you performed NO actions this turn** → You are **Done** for the skirmish (locked out)

### Skirmish End
- Skirmish ends when **BOTH players are Done**
- A player becomes Done by passing without performing any action
- If only one player is Done, the other can keep taking turns

---

## Playing Cards

### Unit Cards
- Play to any **empty** terrain slot (your side)
- **Cannot deploy to occupied slots**
- One unit per terrain per player maximum

**Consume Exception:**
- Units with **Consume** keyword CAN deploy on top of your own units
- Existing unit is consumed (removed to graveyard, Death triggers)
- New unit then deploys to that slot

### Action Cards
- Play from hand, resolve immediately, then discard to graveyard
- Do not occupy terrains
- Can target units or slots

### Graveyard
- All discarded/killed cards go to graveyard
- Graveyard persists between skirmishes
- Face-up, both players can see contents

---

## Leader System

### Leader Selection
- Each player selects **one Leader** before the match begins
- Leader is separate from the deck (not drawn)
- Leader is active for the entire match

### Leader Abilities
Leaders have abilities that can be:
- **Activated:** Click to use, costs charges
- **Passive:** Always active, no charges needed

### Charges
- Leaders have a **maximum number of charges** (typically 3)
- Activated abilities cost charges to use
- Charges do NOT reset between skirmishes (per match resource)
- When charges reach 0, activated abilities cannot be used

### Quick Actions
- Leader abilities are **Quick Actions**
- Using a Leader ability does NOT pass priority automatically
- After using a Leader ability, you can still:
  - Play a card
  - Activate unit abilities
  - Use Leader ability again (if charges remain)
  - Pass or Done

### Example Leaders
- **Aggressive Leader:** "Activated (1 charge): Deal 2 damage to an enemy"
- **Defensive Leader:** "Passive: Your units with Shield get +1 Power"
- **Tactical Leader:** "Activated (1 charge): Move a unit to a close empty slot"

---

## Match End Conditions

### Standard Win
- **2 Skirmish Wins:** First player to 2 skirmish wins = match winner

### Draw
- **Both Reach 2:** If both players reach 2 wins (via ties) = Draw
- Example: Tie-Tie = both have 2 wins = Draw

---

## Quick Reference

### How to Win a Skirmish
1. Control more terrains than opponent (higher power or no opposition)
2. Each controlled terrain = 1 SP
3. Most SP = skirmish winner

### How to Win the Match
- Win 2 skirmishes before your opponent
- OR: Win 1 skirmish + tie 1 skirmish = 2 wins

### Critical Numbers
- **5 Terrains:** Need to control at least 3 to win
- **2 Skirmish Wins:** Need to win the match
- **8 Cards:** Starting hand size
- **3 Cards:** Additional draw each subsequent skirmish

---

*For card abilities and keywords, see [CardMechanics.md](./CardMechanics.md)*
*For complete card list, see [CardCatalog.md](./CardCatalog.md)*
