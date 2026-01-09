# ⚡ Reaction System Architecture

The Reaction system is a data-driven logic engine defined by **Events (Triggers)**, **Logic Gates (Conditions)**, and **Actions (Effects)**.

The system relies on **Polymorphism**: The `type` field in any object acts as a discriminator, determining which other fields are required or valid for that specific object.

---

## 1. Root Structure: `Reaction`

The top-level container for any reaction trait.

```json
{
  "triggers": [ Trigger, Trigger ],       // OR Logic: Any one of these activates the reaction.
  "conditions": [ Condition, Condition ], // AND Logic: All must be true for effects to fire.
  "effects": [ Effect, Effect ],          // Sequential: Actions to execute in order.
  "limit": { LimitConfig }                // (Optional) Constraints on execution frequency.
}
```

---

## 2. Triggers (`Trigger`)

Defines the game event that wakes up the reaction.

### Base Structure

| Property | Type | Description |
| --- | --- | --- |
| **type** | `TriggerType` | The unique ID of the event. |
| **target** | `TargetSelector` | *(Optional)* Filters who triggered the event (e.g., only "Self" or "Enemy"). |

### Specific Schemas (By Type)

#### `Deploy` / `Death` / `TurnStart`

* *No additional parameters.*

#### `PlayCard`

* **cardType** (`String`): **Required.** The specific type of card played (e.g., `"Unit"`, `"Command"`, `"Hacker"`).

#### `Activate`

* **target** (`TargetSelector`): *(Optional)* If the ability requires selecting a target when activated.


---

## 3. Conditions (`Condition`)

A logic gate used to validate the Root Reaction or filter specific Targets.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| **target** | `TargetSelector` | ❌ | The entity to test. Defaults to `Inherited` context if omitted. |
| **path** | `String` | ✅ | The property to check (e.g., `power`, `unitType`, `lastSlot.modifier`). |
| **condition** | `OperatorType` | ✅ | The comparison logic. |
| **value** | `ValueSelector` | ✅ | The value to compare against. |

### Enum: `OperatorType`

* `eq` (Equal)
* `neq` (Not Equal)
* `gt` (Greater Than)
* `lt` (Less Than)
* `contains` (String/List contains)

---

## 4. Target Selector (`TargetSelector`)

The core engine for resolving abstract logic into specific Game Objects.

| Property | Type | Description |
| --- | --- | --- |
| **type** | `TargetStrategy` | **Required.** How to find the target. |
| **entity** | `EntityType` | *(Optional)* What kind of object are we looking for? |
| **proximity** | `ProximityType` | *(Optional)* Spatial range for `Relative` strategy. |
| **relationship** | `RelationType` | *(Optional)* Team alignment. |
| **condition** | `Condition` | *(Optional)* A nested filter to refine the list. |

### Enum: `TargetStrategy`

* `Self`: The owner of the trait.
* `Relative`: Finds entities based on board position relative to Self.
* `RelativeToTrigger`: Finds entities based on the position of the *Trigger* target.
* `RelativeToIteration`: Use the current item being processed in a Loop/Sequence (e.g., inside a ForEach iteration).

### Enum: `EntityType`

* `Unit`
* `Slot`

### Enum: `ProximityType`

* `Close` (Left/Right)
* `Opposing` (Directly across)
* `All` (Entire board)
* `Self` (Current position)

### Enum: `RelationType`

* `Ally`
* `Enemy`
* `None` (Any team)

---

## 5. Effects (The Consequence)

The "Effect" object has been restructured to follow a clear **Who / How / What** pipeline.

```json
{
  "candidates": { ... }, // 1. WHO: Finding potential targets
  "selection": { ... },  // 2. HOW: Choosing the specific target(s)
  "action": { ... }      // 3. WHAT: The effect to apply
}
```

### 5.1 Candidates (The WHO)
Defines the pool of valid entities that *could* be affected. This uses the **Target Selector** schema (see Section 4).

| Property | Type | Description |
| --- | --- | --- |
| **candidates** | `TargetSelector` | **Required.** The logic to find the pool of potential targets (e.g., "All Close Enemies"). |

### 5.2 Selection (The HOW)
Defines how we pick the actual target(s) from the candidate pool.

| Property | Type | Description |
| --- | --- | --- |
| **strategy** | `SelectionStrategy` | **Required.** Method of choice. |
| **min** | `Integer` | *(Optional)* Minimum targets to pick. Default 1. |
| **max** | `Integer` | *(Optional)* Maximum targets to pick. Default 1. |

#### Enum: `SelectionStrategy`
* `All`: Affects everyone in the candidate pool.
* `Player`: The player chooses manually from the list.
* `Random`: The system picks X targets randomly.

### 5.3 Action (The WHAT)
Defines the mechanics to apply to the chosen targets.

| Property | Type | Description |
| --- | --- | --- |
| **type** | `EffectType` | The unique ID of the mechanic (e.g., `DealDamage`). |
| **value** | `ValueSelector` | *(Optional)* The numerical or dynamic value for the effect. |
| **...params** | `Any` | Specific parameters required by the effect type (e.g., `toSlot`). |

---

### Specific Action Schemas

#### `AddArmor` / `AddShield` / `AddPower` / `DealDamage`
* **value**: **Required.** Amount to add/deal.

#### `MoveUnit`
* **toSlot**: `TargetSelector`. Destination slot.
* **swap**: `Boolean`. If true, swaps positions.

#### `Fight`
* **opponent**: `TargetSelector`. Who to fight.

#### `Sequence`
* **effects**: `List<EffectDefinition>`. Child effects.


## 6. Value Selector (`ValueSelector`)

Resolves dynamic numbers or strings.

| Property | Type | Description |
| --- | --- | --- |
| **type** | `ValueSource` | **Required.** Where the value comes from. |
| **value** | `Any` | **Required.** The hardcoded number OR the property path string. |
| **target** | `TargetSelector` | Required *only* if type is `target`. |

### Enum: `ValueSource`

* `static`: A hardcoded integer, boolean, or string.
* `target`: Reads a property from a resolved target entity.
* `me`: Shortcut to read a property from `Self`.

---

## 7. Limit Configuration (`Limit`)

Controls how often a reaction can fire.

| Property | Type | Description |
| --- | --- | --- |
| **scope** | `LimitScope` | **Required.** The duration of the tracking. |
| **max** | `Integer` | **Required.** Maximum executions within the scope. |

### Enum: `LimitScope`

* `Turn`: Resets at the start of the next turn.
* `Round`: Resets at the start of the next round.
* `Game`: Never resets (once per match).

---

## 8. Reference Examples

### Example: Polymorphic Trigger (`PlayCard`)

```json
{
  "triggers": [{
    "type": "PlayCard",
    "cardType": "Command"
  }],
  "effects": []
}
```

### Example: Polymorphic Effect (`MoveUnit`)

```json
{
  "candidates": {
    "type": "Relative",
    "entity": "Unit",
    "proximity": "Close",
    "relationship": "Enemy"
  },
  "selection": { "strategy": "Random" },
  "action": {
    "type": "MoveUnit",
    "toSlot": {
      "type": "Relative",
      "entity": "Slot",
      "proximity": "Opposing",
      "relationship": "Enemy"
    }
  }
}
```

### Example: Dynamic Value (`SetPower`)

```json
{
  "candidates": { "type": "Self" },
  "selection": { "strategy": "All" },
  "action": {
    "type": "SetPower",
    "value": {
      "type": "target",
      "value": "power",
      "target": {
        "type": "Relative",
        "entity": "Unit",
        "proximity": "Opposing",
        "relationship": "Enemy"
      }
    }
  }
}
```

---

### Example: Activated Ability with Limit
*Activate (Once per turn): Deal damage equal to my power to a close enemy.*

```json
{
  "limit": {
    "scope": "Turn",
    "max": 1
  },
  "triggers": [{
    "type": "Activate",
    "target": {
      "type": "Relative",
      "entity": "Unit",
      "proximity": "Close",
      "relationship": "Enemy"
    }
  }],
  "effects": [{
    "type": "DealDamage",
    "value": { "type": "me", "value": "power" },
    "target": { "type": "RelativeToTrigger" }
  }]
}
```

---

## 9. Usage Scenarios

### 1. Simple Buff on Deploy
*When I deploy, I get +2 armor.*

```json
{
  "triggers": [{
    "type": "Deploy",
    "target": { "type": "Self" }
  }],
  "effects": [{
    "candidates": { "type": "Self" },
    "selection": { "strategy": "All" },
    "action": {
      "type": "AddArmor",
      "value": { "type": "static", "value": 2 }
    }
  }]
}
```

### 2. Targeting Enemies (Player Choice)
*When I deploy, I deal 2 damage to a close enemy of my choice.*

```json
{
  "triggers": [{
    "type": "Deploy",
    "target": { "type": "Self" }
  }],
  "effects": [{
    "candidates": {
      "type": "Relative",
      "entity": "Unit",
      "proximity": "Close",
      "relationship": "Enemy"
    },
    "selection": { "strategy": "Player" },
    "action": {
      "type": "DealDamage",
      "value": { "type": "static", "value": 2 }
    }
  }]
}
```

### 3. Multiple Triggers (Area of Effect)
*Deploy and turn starts: I deal 1 damage to each close enemy.*

```json
{
  "triggers": [
    { "type": "Deploy", "target": { "type": "Self" } },
    { "type": "TurnStarts" }
  ],
  "effects": [{
    "candidates": {
      "type": "Relative",
      "entity": "Unit",
      "proximity": "Close",
      "relationship": "Enemy"
    },
    "selection": { "strategy": "All" },
    "action": {
      "type": "DealDamage",
      "value": { "type": "static", "value": 1 }
    }
  }]
}
```

### 4. Conditional Targeting (Nested Conditions)
*When you play a command, modify the slot of every ally hacker by +2.*

```json
{
  "triggers": [{
    "type": "PlayCard",
    "cardType": "Command"
  }],
  "effects": [{
    "candidates": {
      "type": "Relative",
      "entity": "Unit",
      "proximity": "All",
      "relationship": "Ally",
      "condition": {
        "path": "unitType",
        "condition": "contains",
        "value": { "type": "static", "value": "hacker" }
      }
    },
    "selection": { "strategy": "All" },
    "action": {
      "type": "ModifySlot",
      "value": { "type": "static", "value": 2 }
    }
  }]
}
```

### 5. Sequence: Different Effects for Different Targets
*When I deploy, a close ally gets +2 power. If it's a Soldier, it gets +2 armor as well.*

```json
{
  "triggers": [{
    "type": "Deploy",
    "target": { "type": "Self" }
  }],
  "effects": [{
    "candidates": {
      "type": "Relative",
      "entity": "Unit",
      "proximity": "Close",
      "relationship": "Ally"
    },
    "selection": { "strategy": "Player" },
    "action": {
      "type": "Sequence",
      "effects": [
        {
          "candidates": {
             "type": "RelativeToIteration",
             "condition": {
               "path": "unitType",
               "condition": "contains",
               "value": { "type": "static", "value": "soldier" }
             }
          },
          "selection": { "strategy": "All" },
          "action": {
            "type": "AddShield",
            "value": { "type": "static", "value": 2 }
          }
        },
        {
          "candidates": { "type": "RelativeToIteration" },
          "selection": { "strategy": "All" },
          "action": {
             "type": "AddPower",
             "value": { "type": "static", "value": 2 }
          }
        }
      ]
    }
  }]
}
```

### 6. Dynamic Values
*Deploy: My power becomes equal to the opposing enemy.*

```json
{
  "triggers": [{
    "type": "Deploy",
    "target": { "type": "Self" }
  }],
  "effects": [{
    "candidates": { "type": "Self" },
    "selection": { "strategy": "All" },
    "action": {
      "type": "SetPower",
      "value": {
        "type": "target", // target here refers to the Value Candidate
        "value": "power",
        "target": {
          "type": "Relative",
          "entity": "Unit",
          "proximity": "Opposing",
          "relationship": "Enemy"
        }
      }
    }
  }]
}
```


### 11. Complex Dependency (Iterative Context)
*Deploy: Each ally fights its own opposing enemy.*

```json
{
  "triggers": [{
    "type": "Deploy",
    "target": { "type": "Self" }
  }],
  "effects": [{
    "candidates": {
      "type": "Relative",
      "entity": "Unit",
      "relationship": "Ally",
      "proximity": "All"
    },
    "selection": { "strategy": "All" },
    "action": {
      "type": "Sequence",
      "iteration": "ForEach",
      "effects": [{
        "action": {
          "type": "Fight",
          "opponent": {
            "type": "Relative", // Relative to the *Iterated Ally*, not the Source (Me)
            "proximity": "Opposing",
            "relationship": "Enemy"
          }
        }
      }]
    }
  }]
}
```

---

## 9. Appendix: Comprehensive Reference

### 7. Trigger Logic: Conditional Trigger Source
*When a close enemy dies, if it was on a negative slot, modify its slot by -1.*

```json
{
  "triggers": [{
    "type": "Death",
    "target": {
      "type": "Relative",
      "proximity": "Close",
      "relationship": "Enemy",
      "entity": "Unit",
      "condition": [{
        "path": "lastSlot.modifier",
        "condition": "lt",
        "value": { "type": "static", "value": 0 }
      }]
    }
  }],
  "effects": [{
    "candidates": {
      "type": "RelativeToTrigger",
      "entity": "Slot"
    },
    "selection": { "strategy": "All" },
    "action": {
      "type": "ModifySlot",
      "value": { "type": "static", "value": -1 }
    }
  }]
}
```

### 8. Reaction Conditional Logic
*Deploy: Move a close enemy to my opposing slot. (Do only if the slot is empty.)*

```json
{
  "triggers": [{
    "type": "Deploy",
    "target": { "type": "Self" }
  }],
  "conditions": [{
    "target": {
      "type": "Relative",
      "entity": "Slot",
      "proximity": "Opposing"
    },
    "path": "isEmpty",
    "condition": "eq",
    "value": { "type": "static", "value": true }
  }],
  "effects": [{
    "candidates": {
      "type": "Relative",
      "entity": "Unit",
      "proximity": "Close",
      "relationship": "Enemy"
    },
    "selection": { "strategy": "Player" },
    "action": {
      "type": "MoveUnit",
      "toSlot": {
        "type": "Relative",
        "entity": "Slot",
        "proximity": "Opposing",
        "relationship": "Enemy"
      }
    }
  }]
}
```

### 9. Filter with Dynamic Comparison
*When a close enemy deploys with less power than me, I fight it.*

```json
{
  "triggers": [{
    "type": "Deploy",
    "target": {
      "proximity": "Close",
      "entity": "Unit",
      "relationship": "Enemy",
      "condition": [{
        "path": "power",
        "condition": "lt",
        "value": { "type": "me", "value": "power" }
      }]
    }
  }],
  "effects": [{
    "candidates": { "type": "Relative", "proximity": "Self" },
    "selection": { "strategy": "All" },
    "action": {
      "type": "Fight",
      "opponent": { "type": "RelativeToTrigger" }
    }
  }]
}
```

---

## 10. Appendix: Comprehensive Reference

### A. Trigger Reference Table

| Trigger | Context Data Available | Description |
| :--- | :--- | :--- |
| `ON_DEPLOY` | `unit` (self), `slot` (deployed slot) | Fires when this unit is placed on the board. |
| `ON_DEATH` | `unit` (died), `killer` (source), `slot` (where it died) | Fires when any unit reaches 0 HP. |
| `ON_TURN_START` | `player` (active player) | Fires at the start of a turn. |
| `ON_CARD_PLAYED` | `card` (played card), `target` (if any) | Fires when any card is played. |

### B. Complete Effect Catalog

| Effect | Required Params | Behavior |
| :--- | :--- | :--- |
| `BOUNCE` | `target` | Returns unit to hand. Resets stats. |
| `KILL` | `target` | Instantly sets HP to 0 (ignores shields). |
| `DEPLOY_UNIT`| `unitId`, `target` (Slot) | Creates a new specific unit token. |
| `HEAL` | `value`, `target` | Restores HP up to max. |
| `CLEANSE` | `target`, `statusType` (optional) | Removes specific or all negative status effects. |
| `ADD_SHIELD` | `value`, `target` | Adds temporary hit points. |
| `DRAW_CARDS` | `value` (count), `target` (player) | Draws cards from the deck. |
| `MOVE_UNIT` | `toSlot`, `swap` (optional) | Moves unit to a new slot, optionally swapping with occupant. |

### C. Data Path Reference

*   `"power"`, `"health"`, `"baseHealth"`, `"maxHealth"`
*   `"cost"`, `"name"`, `"tags"` (List)
*   `"slot.index"`, `"slot.lane"`, `"slot.isEmpty"`
*   `"owner.handSize"`, `"owner.energy"`

### D. Deprecated Mechanics
> [!WARNING]
> The following mechanics are **DEPRECATED** and should not be used in new designs.

*   **Conquer (`ON_CONQUER`)**: Replaced by standard board control mechanics.
*   **Consume (`ON_CONSUME`, `ON_CONSUMED`)**: Removed from core gameplay loop.
