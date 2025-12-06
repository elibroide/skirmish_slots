# Core Rules

**IMPORTANT: This document is part of the PRIMARY SOURCE of information about how the game functions. Any discrepancies between this document and other documentation or code should be fixed to match the Game Design documentation.**

## Match Format

**Best of 3 Skirmishes**
- First player to win 2 skirmishes wins the match
- Players compete across 5 terrains to control the majority

---

## Victory Conditions

### Skirmish Victory
- **Win Condition:** Control more terrains than your opponent
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

- **Scoring:** Each terrain you control at skirmish end = 1 SP
- **Purpose:** Used for tracking and card effects
- **Conquer Trigger:** Card abilities reference "when I win a terrain"
- **Winner Determination:** Player with most SP wins the skirmish

**Example:**
- You control terrains 1, 2, and 4 = 3 SP
- Opponent controls terrains 0 and 3 = 2 SP
- You win with 3 SP vs 2 SP

---

## Deck Construction Rules

### Deck Size
- **Minimum:** 20 cards
- **Maximum:** 30 cards
- **Recommended:** Start with 20 cards for new players

### Copy Limit
- **Max Copies:** 2-3 copies of any single card
- **Note:** Playtesting will determine final number (currently testing)

### Card Types
- **Unit Cards:** Deploy to terrains, have power
- **Action Cards:** One-time effects, played from hand

---

## Skirmish Start

### First Skirmish
**Draw 8 cards** from your deck
- This is your starting hand
- No mulligan phase in MVP (future feature)

### Subsequent Skirmishes
**Draw 3 additional cards** from your deck
- Add to your existing hand
- No hand size limit

### No Hand Size Limit
- **Keep All Cards:** Players keep all cards drawn throughout the match
- Cards stay in hand between skirmishes
- Only removed when played or discarded

---

## Game Setup Sequence

1. **Build Decks:** Each player constructs a 20-30 card deck
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

### What Clears
- **All Units:** Removed from terrains to graveyard
- **Slot Modifiers:** All power modifiers cleared
- **Turn State:** Pass status resets

---

## Turn Order Rules

### First Skirmish
- **Random:** Determined randomly
- Both players have equal chance to start

### Subsequent Skirmishes
- **Loser Goes First:** Player who **lost** previous skirmish starts
- **After Tie:** Starting player alternates
  - Example: P1 started Skirmish 1 (tied) → P2 starts Skirmish 2

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

*For detailed gameplay mechanics, see [Gameplay.md](./Gameplay.md)*
