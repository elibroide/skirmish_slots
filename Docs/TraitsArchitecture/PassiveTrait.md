# 🛡️ Passive Trait System Architecture

The Passive system calculates the **Current State** of a unit or the game board. It does not wait for triggers; it applies **Modifiers** continuously as long as its **Conditions** are met.

## 1. Root Structure: `PassiveTrait`

The container for the logic. It acts as a "Toggle Switch."

```json
{
  "conditions": [ Condition, Condition ], // AND Logic: If any are false, the modifiers disable.
  "modifiers": [ Modifier, Modifier ]     // The list of status effects to apply.
}
```

* **Logic:** The engine evaluates `conditions` every time the board state changes (or marks them dirty).
* If **True**: The `modifiers` are added to the game state layers.
* If **False**: The `modifiers` are removed.

---

## 2. Modifiers (`Modifier`)

A definition of *what* is being changed.

| Property | Type | Description |
| --- | --- | --- |
| **type** | `ModifierType` | **Required.** What aspect of the game is being altered. |
| **target** | `TargetSelector` | **Required.** Who receives the bonus. |
| **value** | `ValueSelector` | *(Optional)* The magnitude (Amount of Stats, specific Rule enum). |
| **trait** | `TraitObject` | *(Optional)* Used for `GrantTrait`. The full JSON of the ability being given. |
| **condition** | `Condition` | *(Optional)* A filter to refine the target list (e.g., "Buff only Soldiers"). |

### Enum: `ModifierType`

#### Stat & Attribute Modifiers

* `BuffPower` / `BuffShield`: Adds +X to the stat.
* `SetPower`: Overrides the stat to a fixed value (X).
* `ModifySlot`: Adds a modifier to the terrain/slot itself.

#### Capability Modifiers

* `GrantTrait`: Gives the target a new Trait (Passive or Reaction).
* `AddDeploymentRule`: Adds a permission (e.g., "Can target Enemy Slots", "Can target Ally Units").

#### Game Rule Modifiers

* `SetWinCondition`: Changes how the lane winner is calculated (e.g., `LowestPower`).
* `BlockHealing`: Prevents healing on the target.

---

## 3. Modifier Implementation Pattern

To keep the system modular, each `ModifierType` maps to a specific class instance that extends the abstract `Modifier` base class.

### Base Class: `Modifier`
```typescript
abstract class Modifier {
  constructor(protected config: ModifierConfig) {}
  
  abstract type: ModifierType;
  
  // Applies the modification to the game state
  abstract apply(target: GameEntity, context: ModifierContext): void;
  
  // Removes the modification (cleanup)
  abstract remove(target: GameEntity, context: ModifierContext): void;
}
```

### Concrete Classes Strategy

Each concrete class handles the specific logic for its type:

* **`BuffPowerModifier`**: 
    * `apply`: Resolves `value` and adds to `unit.buffs`.
    * `remove`: Subtracts the value from `unit.buffs`.
* **`GrantTraitModifier`**: 
    * `apply`: Instantiates a new Trait (Reaction or Passive) from the config and attaches it to the target entity. Stores the reference.
    * `remove`: Detaches the specific trait instance it created.
* **`RuleModifier`**: 
    * `apply`: Registers a rule override with the `RuleManager`.
    * `remove`: Unregisters the rule.

This separation allows for complex state management (e.g., `GrantTraitModifier` tracking created instances) without cluttering the main `PassiveTrait` logic.

---

## 4. Shared Structures (Reused)

This system uses the exact same logic blocks as the Reaction System.

* **`Condition`**: (Logic Gates)
* *New Operator Needed:* `count_gte`, `count_eq` (For "If I have 2+ allies").


* **`TargetSelector`**: (Finding Units/Slots)
* *New Strategy Needed:* `Zone` (For targeting Hand/Deck).
* *New Strategy Needed:* `Source` (Refers to the unit generating the Aura, useful for `GrantTrait`).


* **`ValueSelector`**: (Dynamic Numbers)

---

## 5. Reference Examples

### Example A: Conditional Self-Buff ("Commander")

*"I have +3 Power as long as there are 2 close allies."*

```json
{
  "conditions": [{
    "target": { 
      "type": "Relative", "entity": "Unit", "proximity": "Close", "relationship": "Ally" 
    },
    "operator": "count_gte", // Checks quantity of targets found
    "value": { "type": "static", "value": 2 }
  }],
  "modifiers": [{
    "type": "BuffPower",
    "target": { "type": "Self" },
    "value": { "type": "static", "value": 3 }
  }]
}
```

### Example B: Aura ("Captain")

*"The unit to my right has +2 Power."*

```json
{
  "modifiers": [{
    "type": "BuffPower",
    "target": { 
      "type": "Relative", "entity": "Unit", "proximity": "Right", "relationship": "Ally" 
    },
    "value": { "type": "static", "value": 2 }
  }]
}
```

### Example C: Granting Abilities ("Network Hub")

*"The unit to my right gains: 'Project my power to the center'."*

```json
{
  "modifiers": [{
    "type": "GrantTrait",
    "target": { "type": "Relative", "proximity": "Right" },
    "trait": {
      "type": "PassiveTrait", // The trait being given
      "modifiers": [{
        "type": "ProjectPower",
        "target": { "type": "Absolute", "lane": "Center" },
        "value": {
          "type": "target",
          "target": { "type": "Source" }, // 'Source' = The unit that HAS this granted trait
          "value": "power"
        }
      }]
    }
  }]
}
```

### Example D: Hand Buff / Rules ("Nano-Mother")

*"All units in your hand have Modular (Target Ally Unit)."*

```json
{
  "modifiers": [{
    "type": "AddDeploymentRule",
    "target": { 
      "type": "Zone", 
      "zone": "Hand", 
      "condition": { "path": "cardType", "operator": "eq", "value": "Unit" } 
    },
    "value": { "type": "static", "value": "AllyUnit" } // The rule allowing Modular targeting
  }]
}
```
