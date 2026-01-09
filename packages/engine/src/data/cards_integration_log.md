# Card Integration Log

This document tracks cards that were **skipped** during the migration to the data-driven architecture, along with the reasons (missing mechanics, effects, or logic).

## Skipped Cards

| Card Name | Missing Feature | Notes |
| :--- | :--- | :--- |
| **Void Administrator** | Effect: `Nullify` | Requires a "Silence" or "Remove Traits" effect type. |
| **Infinite Replicator** | Effect: `Clone` | Requires logic to copy a unit state (including buffs) or spawn a specific copy. |
| **Storage Servant** | Effect: `CreateCard` | Requires mechanics to generate cards into hand. |
| **Noble Defender** | Passive: `Intercept` | Requires `PassiveTrait` or `RuleModifier` to redirect damage events. |
| **Null-Operative** | Passive: `ModifyRule` | Requires logic to modify deployment rules or passive power auras. |
| **Polarity Jester** | Passive: `WinCondition` | Requires logic to alter win condition calculation. |
| **System Router** | Effect: `Project` | "Projecting power" mechanic is not clearly defined/implemented. |
| **Mirror Image** | Effect: `Project` | Same as System Router. |
| **Reflex Daemon** | Effect: `Project` | Same as System Router. |
| **Evertree** | Passive: `Permanent` | Requires distinct logic for permanent/indestructible units. |

## Next Steps

To integrate these cards, the Reaction System and Game Engine need to be extended with the missing Effect Types or Passive Trait architecture.
