# Rule System Architecture

## Overview

The Rule System allows cards to dynamically modify core game rules such as deployment validity, targeting restrictions, consumption logic, and even terrain resolution. It replaces hardcoded flags with a flexible, scalable hook system that supports both boolean checks and value-based rules.

## Key Components

### 1. Rule Manager (`src/engine/rules/RuleManager.ts`)
The central registry for all active rule modifiers.
- **Modifiers**: Generic functions (`RuleModifier<T>`) that take a context and the current result, returning a new result.
- **Registration**: Cards register modifiers by ID and Rule Type.
- **Evaluation**: The Engine iterates through registered modifiers to determine the final outcome. Supports generics to handle various return types (boolean, numbers, PlayerId, etc.).

### 2. Rule Types (`src/engine/rules/RuleTypes.ts`)
- **`CAN_DEPLOY`**: (Boolean) Validates if a card can be deployed to a specific terrain/slot.
- **`CAN_TARGET`**: (Boolean) Validates if a card can target a specific entity.
- **`CAN_CONSUME`**: (Boolean) Validates if a unit can consume another unit.
- **`DETERMINE_TERRAIN_WINNER`**: (`PlayerId | null`) Determines the winner of a terrain, allowing override of standard power comparison (e.g., Rogue).

### 3. Engine Integration (`src/engine/GameEngine.ts`)
The `GameEngine` integrates the `RuleManager` and exposes validation methods:
- `isDeploymentAllowed(card, terrainId)`
- `isTargetingAllowed(source, target)`

Effect execution (like `ResolveSkirmishEffect`) also directly queries `ruleManager.evaluate()` for custom logic.

### 4. Card Integration (`src/engine/cards/Card.ts`)
- **`registerRule<T>(type, modifier)`**: Generic helper to add a rule.
- **`unregisterRule(type?)`**: Helper to remove rules.
- **`onLeave()`**: Lifecycle hook called when a card leaves play, automatically unregistering rules.

## Example Usage

### Sentinel (Boolean Rule)
Blocks deployment in front of it.

```typescript
class Sentinel extends UnitCard {
  onDeploy() {
    this.registerRule(RuleType.CAN_DEPLOY, (context, result) => {
      if (context.terrainId === this.terrainId && context.playerId !== this.owner) {
         return false;
      }
      return result;
    });
  }
}
```

### Rogue (Value Rule)
Changes terrain win condition to "lowest power wins".

```typescript
class Rogue extends UnitCard {
  onDeploy() {
    this.registerRule<PlayerId | null>(
      RuleType.DETERMINE_TERRAIN_WINNER, 
      (context, currentWinner) => {
        const { terrainId, power0, power1 } = context as TerrainResolutionContext;
        
        // Only modify if on this terrain
        if (terrainId !== this.terrainId) return currentWinner;
        
        // Invert logic (lowest wins)
        if (power0 < power1) return 0;
        if (power1 < power0) return 1;
        return null; // Tie
      }
    );
  }
}
```

## Benefits
- **Decoupling**: The Engine doesn't need to know about specific card mechanics.
- **Scalability**: New mechanics (like "Reverse Gravity" or "Peace Treaty") can be added by defining new Rule Types.
- **Generics**: Supports complex rule overrides beyond simple "allowed/not allowed" checks.
