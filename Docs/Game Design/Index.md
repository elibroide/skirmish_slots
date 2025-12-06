# Game Design Documentation

## Overview
Skirmish is a 2-player tactical card game where players deploy units and play actions across five terrains, competing to win skirmishes through strategic positioning and resource management. The match is best-of-3 skirmishes, with the first player to win 2 skirmishes winning the match.

**Core Mechanics:**
- 5 terrains with one slot per player
- Turn-based play: play card, activate abilities, or declare "Done"
- Skirmish ends when both players are done
- Control more terrains to win the skirmish

---

## Documentation Structure

### [CoreRules.md](./CoreRules.md) (~150 lines)
**Victory conditions, setup, and match structure**

Everything about how to win and start playing:
- Match format (best of 3)
- Victory conditions & edge cases
- Skirmish victory rules
- Skirmish Points (SP)
- Deck construction
- Starting hands & draws

**When to read:** Understanding how to win, setting up a match, deck building rules.

---

### [Gameplay.md](./Gameplay.md) (~200 lines)
**Turn structure, battlefield, and card playing**

The core game loop and how turns work:
- Battlefield layout (5 terrains)
- Turn structure (play/activate/done)
- Done mechanics & lockout
- Turn order rules
- Playing unit cards (replacement rules)
- Playing action cards
- Graveyard rules
- Skirmish resolution sequence

**When to read:** Learning how to play, understanding turn mechanics, implementing game flow.

---

### [CardMechanics.md](./CardMechanics.md) (~200 lines)
**Keywords, effects, and targeting rules**

How card abilities work:
- Timing keywords (Deploy, Activate, Conquer, Consume, Death)
- Power modification (damage, buffs, wounded)
- Slot modifiers (format, stacking, clearing)
- Positional terms (Close, In front, All)
- Targeting rules (ally, enemy, unit, slot)
- Area effects
- Reserved mechanics (Bounce, Heal)

**When to read:** Implementing card effects, understanding keyword interactions, resolving timing questions.

**See Also:** [CardSystem.md](../Code%20Architecture/CardSystem.md) for technical implementation of these mechanics.

---

### [CardCatalog.md](./CardCatalog.md) (~150 lines)
**Complete card list with stats and abilities**

Pure reference database:
- 23 unit cards (alphabetically ordered)
- 7 action cards (alphabetically ordered)
- Base power values
- Abilities and effects

**When to read:** Looking up specific card abilities, checking card stats, implementing new cards.

---

### [StrategyGuide.md](./StrategyGuide.md) (~150 lines)
**Strategy tips, FAQs, and design philosophy**

How to play well and why the game works this way:
- Resource management strategy
- Terrain priority decisions
- Slot modifier tactics
- Conquer strategy
- Consume synergies
- Passing dynamics
- Common timing questions (FAQ)
- Design philosophy & core pillars

**When to read:** Learning advanced strategies, understanding design intent, answering "why" questions.

---

## Quick Navigation

### Looking for specific information?

- **How do I win?** → [CoreRules.md](./CoreRules.md)
- **How do turns work?** → [Gameplay.md](./Gameplay.md)
- **What does "Conquer" mean?** → [CardMechanics.md](./CardMechanics.md)
- **What's Archer's ability?** → [CardCatalog.md](./CardCatalog.md)
- **Should I pass early or late?** → [StrategyGuide.md](./StrategyGuide.md)

### Common Questions

- **Setup:** CoreRules.md - Deck construction & starting hands
- **Battlefield:** Gameplay.md - 5 terrains, slots, positioning
- **Keywords:** CardMechanics.md - Deploy, Activate, Conquer, etc.
- **Power:** CardMechanics.md - Damage, buffs, wounded
- **Timing:** StrategyGuide.md - FAQ section

---

## Related Documentation

- **Code Architecture** → [../Code Architecture/Index.md](../Code%20Architecture/Index.md)
  - Implementing these game rules in code
- **UI Design** → [../UI Design/Index.md](../UI%20Design/Index.md)
  - Visualizing game state and interactions

---

*This index covers all game design documentation. Load only the files you need for your current task.*
