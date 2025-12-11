# Milestone 1 Cards

This document tracks the implementation status of cards for the first milestone (AI Opponent).

## Card Status Legend
- **Implemented**: Code already exists in the engine/examples.
- **Implementable**: Can be implemented with current engine features.
- **Blocked**: Requires engine features or UI support that is currently marked as "not ready" (Activate, Slot Buffs) or technical limitations (Two-target actions).

---

## Card List

### Accolyte
*   **Type**: Unit (1 Power)
*   **Text**: Consumed: Consuming unit get +3.
*   **Status**: Implementable
*   **Notes**: Use `onConsumed` lifecycle hook. Logic: `consumingUnit.addPower(3)`.

### Apprentice
*   **Type**: Unit (3 Power)
*   **Text**: Consume: Draw a card.
*   **Status**: Implementable (Needs Verification)
*   **Notes**: Assumes "Consume:" means "When I consume another unit". Requires a hook or check during deployment if consumption occurred. If it triggers on deployment consumption, logic goes in `onDeploy`.

### Archer
*   **Type**: Unit (3 Power)
*   **Text**: Deploy: Deal 2 damage to a close enemy.
*   **Status**: Implemented
*   **Notes**: Existing example in `CardSystem.md`.

### Assassinate
*   **Type**: Action
*   **Text**: Kill an enemy with power 5 or greater.
*   **Status**: Implementable
*   **Notes**: Standard targeting with validation logic checking `target.power >= 5`.

### Bard
*   **Type**: Unit (2 Power)
*   **Text**: When your turn starts, close allies get +1.
*   **Status**: Implementable
*   **Notes**: Use `onTurnStart` lifecycle hook and `getCloseAllies()`.

### Champion
*   **Type**: Unit (5 Power)
*   **Text**: (Vanilla)
*   **Status**: Implemented
*   **Notes**: Existing example in `CardSystem.md`.

### Dragon
*   **Type**: Unit (7 Power)
*   **Text**: Can only be deployed to consume another unit.
*   **Status**: Implementable
*   **Notes**: Use `RuleManager` to modify `CAN_DEPLOY` rules (must target occupied slot owned by self).

### Energize
*   **Type**: Action
*   **Text**: An ally gets +3.
*   **Status**: Implementable
*   **Notes**: Simple targeting action (Target Type: Ally Unit).

### Engineer
*   **Type**: Unit (1 Power)
*   **Text**: On your turn start, my slot gets +1.
*   **Status**: Blocked
*   **Notes**: **Slot Buffs** are currently marked as not ready.

### Fireball
*   **Type**: Action
*   **Text**: Choose a slot, deal 2 damage to the unit on it and each close unit.
*   **Status**: Implemented
*   **Notes**: Existing example in `CardSystem.md`.

### Ghoul
*   **Type**: Unit (1 Power)
*   **Text**: When a close unit dies, I get +2.
*   **Status**: Implemented
*   **Notes**: Existing example in `CardSystem.md` (uses `subscribe('UNIT_DIED')`).

### Hunter
*   **Type**: Unit (4 Power)
*   **Text**: Kill a close wounded unit.
*   **Status**: Implementable
*   **Notes**: Deploy effect. Target validation: `closeUnit.power < closeUnit.originalPower`.

### Knight
*   **Type**: Unit (3 Power)
*   **Text**: Deploy: You may deploy a Squire to a close ally slot. (Its 1 powered)
*   **Status**: Implementable
*   **Notes**: Requires `DeployUnitEffect` and a "Squire" token definition.

### Mimic
*   **Type**: Unit (1 Power)
*   **Text**: Deploy: My power becomes equal to the enemy in front of me.
*   **Status**: Implementable
*   **Notes**: Use `getUnitInFront()`. If null, power remains 1? Needs edge case handling.

### Necromancer
*   **Type**: Unit (2 Power)
*   **Text**: Activate (cooldown 1): You may deploy a dead ally with power 3 or less.
*   **Status**: Blocked
*   **Notes**: **Activate** keyword is currently marked as not ready. Also requires Graveyard UI/Selection logic.

### Noble
*   **Type**: Unit (4 Power)
*   **Text**: Conquer: Draw two cards. (Triggers when I win a terrain.)
*   **Status**: Implemented
*   **Notes**: Existing example in `CardSystem.md`.

### Priest
*   **Type**: Unit (2 Power)
*   **Text**: Deploy: Cleanse a close slot. (Remove all abilities and buffs from the unit on it and from the slot.)
*   **Status**: Implementable (Partial)
*   **Notes**: Removing buffs (power changes) is complex if not tracked as separate modifiers. Removing slot effects requires engine support to clear `slot.modifiers`.

### Ranger
*   **Type**: Unit (4 Power)
*   **Text**: Activate: Move me to a close ally slot. (Switch positions if occupied.)
*   **Status**: Blocked
*   **Notes**: **Activate** keyword is currently marked as not ready.

### Repositioning
*   **Type**: Action
*   **Text**: Move an unit to a close slot of the same player. (Switch positions if occupied.)
*   **Status**: Blocked
*   **Notes**: Requires selecting TWO targets (Unit to move + Destination Slot). Current targeting system supports only single selection phase.

### Rogue
*   **Type**: Unit (2 Power)
*   **Text**: This terrain is won by the lowest power instead of the highest.
*   **Status**: Implementable (Complex)
*   **Notes**: Requires engine support for dynamic Win Conditions per terrain. Currently likely hardcoded to highest power. Needs `RuleType.WIN_CONDITION` or similar.

### Rookie
*   **Type**: Unit (3 Power)
*   **Text**: Activate (cooldown 2): Both my and a close slots get +2.
*   **Status**: Blocked
*   **Notes**: **Activate** keyword and **Slot Buffs** are currently marked as not ready.

### Roots
*   **Type**: Unit (2 Power)
*   **Text**: Death: My slot gets bonus equal to my power.
*   **Status**: Blocked
*   **Notes**: **Slot Buffs** are currently marked as not ready.

### Scout
*   **Type**: Unit (2 Power)
*   **Text**: Deploy: Draw a card.
*   **Status**: Implemented
*   **Notes**: Existing example in `CardSystem.md`.

### Seed
*   **Type**: Action
*   **Text**: Give a slot and close slots to it +1.
*   **Status**: Blocked
*   **Notes**: **Slot Buffs** are currently marked as not ready.

### Sentinel
*   **Type**: Unit (3 Power)
*   **Text**: An enemy cannot be deployed in front of me.
*   **Status**: Implementable
*   **Notes**: Register `RuleType.CAN_DEPLOY` modifier on `onDeploy`.

### Strike
*   **Type**: Action
*   **Text**: Deal 3 damage to a unit.
*   **Status**: Implemented
*   **Notes**: Existing example in `CardSystem.md`.

### Turret
*   **Type**: Unit (3 Power - assumed, labeled Action in query but has stats/behavior of Unit)
*   **Text**: When your turn starts, deal 1 damage to the enemy in front of me.
*   **Status**: Implementable
*   **Notes**: Use `onTurnStart` and `getUnitInFront()`.

### Unsummon
*   **Type**: Action
*   **Text**: Return a unit to hand.
*   **Status**: Implementable
*   **Notes**: Logic exists in Bouncer example (`BounceUnitEffect`).

### Vampire
*   **Type**: Unit (2 Power)
*   **Text**: When a close unit is dealt damage, I gain that much power. Activate (Cooldown 1): Deal 2 damage to a close unit.
*   **Status**: Partially Blocked
*   **Notes**: Passive ability is **Implementable** (`subscribe('UNIT_DAMAGED')`). Active ability is **Blocked** (Activate not ready).

### Warlock
*   **Type**: Unit (3 Power)
*   **Text**: Consume: I deal damage to a close enemy equal to the consumed unit’s power.
*   **Status**: Implementable (Needs Verification)
*   **Notes**: Same note as **Apprentice**. Needs "On Consume" trigger logic.

### Wizard
*   **Type**: Unit (3 Power)
*   **Text**: When you play an action, give my slot +2.
*   **Status**: Blocked
*   **Notes**: **Slot Buffs** are currently marked as not ready.

