# Code Architecture Documentation

## Overview
Skirmish uses an event-driven architecture with hardcoded card classes, FIFO effect queue, and clean UI separation. The game engine is pure TypeScript logic that emits events to the React UI layer.

**Core Principle:** UI = f(events)
The UI never directly accesses engine state—it only listens to events and sends actions back.

---

## Architecture Diagram

```
┌─────────────────┐
│  Game Engine    │  ← Pure logic, no UI
│  (TypeScript)   │  ← Hardcoded card classes
│                 │  ← Emits events
└────────┬────────┘
         │ Events only (one direction)
         ▼
┌─────────────────┐
│   UI Layer      │  ← Listens to events
│   (React)       │  ← Renders state
│                 │  ← Sends actions back
└────────┬────────┘
         │ Actions only
         ▼
┌─────────────────┐
│  Game Engine    │  ← Validates & processes
└─────────────────┘
```

---

## Core Systems

### [ArchitectureOverview.md](./ArchitectureOverview.md) (~150 lines)
**Philosophy, principles, and high-level design**

- Event-driven separation principle
- Architecture diagrams
- Golden rule: UI = f(events)
- Design goals (fast prototyping, type safety, clean separation)

**When to read:** Understanding overall architecture, onboarding new developers.

---

### [EngineCore.md](./EngineCore.md) (~200 lines)
**Game state, action processing, and core engine**

- GameEngine responsibilities
- GameState structure
- ActionProcessor
- StateChecker
- EventEmitter integration
- Action → State transition flow

**When to read:** Understanding game state management, implementing action processing.

---

### [EffectSystem.md](./EffectSystem.md) (~250 lines)
**Effect queue and FIFO processing**

- Effect queue purpose
- FIFO structure (why queue not stack)
- Processing algorithm with detailed code
- Effect chaining examples
- Martyr death chain walkthrough

**When to read:** Implementing card effects, debugging effect resolution order.

**See Also:** [EffectClasses.md](./EffectClasses.md) for specific effect implementations.

---

### [EffectClasses.md](./EffectClasses.md) (~200 lines)
**Base Effect class and common effect implementations**

- Base Effect class
- EffectResult interface
- PlayCardEffect, DeployUnitEffect, SacrificeUnitEffect
- ModifyPowerEffect, DrawCardEffect
- Effect execution patterns

**When to read:** Creating new effects, understanding effect structure.

---

### [CardSystem.md](./CardSystem.md) (~300 lines)
**Card classes, lifecycle hooks, and registry**

- Base Card, UnitCard, ActionCard classes
- Lifecycle hooks (onDeploy, onDeath, onConquer, etc.)
- Helper methods (addPower, dealDamage, getCloseAllies)
- CardRegistry and factory pattern

**When to read:** Understanding card base classes, implementing action cards.

**See Also:** [TraitSystem.md](./TraitSystem.md) for ECS unit card implementation.

---

### [TraitSystem.md](./TraitSystem.md) (~400 lines)
**ECS trait-based unit card architecture**

- Entity-Component-System pattern overview
- 6 trait types (Reaction, OngoingReaction, RuleModifier, Shield, Activate, Special)
- Trait lifecycle and attachment flow
- Card definitions (data-driven approach)
- Dynamic trait application ("give shield to allies")
- Migration from class-based to ECS

**When to read:** Implementing new unit cards, understanding trait composition, giving abilities dynamically.

**See Also:** [CardMechanics.md](../Game%20Design/CardMechanics.md) for game design rules.

---

## Advanced Systems

### [TargetingSystem.md](./TargetingSystem.md) (~250 lines)
**Two-phase play and target validation**

- Targeting purpose & examples
- Two-phase play flow (select card → select target)
- Action structure with targets
- Card targeting requirements
- TargetInfo type definitions
- Fireball example (damage spell)
- UI flow for targeting
- Validation logic
- Auto-target fallback for AI

**When to read:** Implementing cards that need targets, understanding targeting UI.

---

### [EventSystem.md](./EventSystem.md) (~150 lines)
**Event types, emitter, and subscriptions**

- Complete GameEvent type definitions
- EventEmitter implementation
- Subscribe/unsubscribe pattern
- Usage in engine
- Event emission patterns
- STATE_SNAPSHOT pattern

**When to read:** Adding new event types, subscribing to events in UI.

---

### [StateChecking.md](./StateChecking.md) (~100 lines)
**State-based condition checking**

- State checking purpose
- Checks performed (deaths, round end, win conditions)
- StateChecker implementation
- checkDeaths, shouldEndRound, shouldEndMatch
- Integration with effect queue

**When to read:** Understanding automated rule enforcement, debugging state transitions.

---

### [RulesSystem.md](./RulesSystem.md) (~100 lines)
**Rule Modification System (Validators)**

- Rule Manager & Modifiers
- Rule Types (CAN_DEPLOY, CAN_TARGET, CAN_CONSUME)
- Registration & Lifecycle (onLeave)
- Integration with Engine & Cards

**When to read:** Understanding targeting logic, implementing cards with restrictions (e.g. Sentinel, Stealth).

---

### [UIArchitecture.md](./UIArchitecture.md) (~200 lines)
**React layer, Zustand store, and component structure**

- UI responsibilities
- Key principle: no direct state access
- State management with Zustand
- GameStore structure & implementation
- Component tree structure
- Event subscription patterns
- Action dispatch patterns

**When to read:** Implementing UI components, managing application state.

**See Also:** [UI Design/Index.md](../UI%20Design/Index.md) for visual design.

---

### [AnimationSystem.md](./AnimationSystem.md) (~150 lines)
**Animation queue and Framer Motion integration**

- Animation queue structure
- Animation interface
- Queue processing (playNext algorithm)
- Event to animation mapping
- Example mappings (card play, power change, death)
- Framer Motion animation components
- PowerBuffAnimation, UnitDeathAnimation examples

**When to read:** Adding new animations, debugging animation timing.

---

### [AISystem.md](./AISystem.md) (~200 lines)
**AI interfaces and strategies**

- AIStrategy interface
- AIController implementation
- HeuristicAI (scoring algorithm)
- ClaudeAI (API integration, prompt building)
- Action scoring heuristics
- Prompt construction for LLM
- Response parsing & validation

**When to read:** Implementing new AI strategies, improving AI behavior.

**See Also:** [PlayerController.md](./PlayerController.md) for player abstraction.

---

### [ReplaySystem.md](./ReplaySystem.md) (~150 lines)
**Action logging and replay functionality**

- ActionLogger implementation
- ActionLog data structures
- Recording actions
- Export/save functionality
- ReplayPlayer implementation
- Playback with speed control
- Integration with GameEngine

**When to read:** Implementing replay features, debugging game sessions.

---

### [GameFlow.md](./GameFlow.md) (~350 lines)
**Round resolution, game flow, and power system**

- Round start sequence (StartRoundEffect)
- Card drawing rules
- Round resolution sequence (ResolveRoundEffect)
- Slot winner calculation
- Conquer trigger order
- Match end conditions
- Round cleanup
- Priority & turn system
- Power system (damage, addPower, heal)
- UI display rules

**When to read:** Understanding full game loop, implementing round logic.

---

### [PlayerController.md](./PlayerController.md) (~379 lines)
**Player abstraction for flexible player types**

- PlayerController abstraction design
- Vision for flexible player types (Human, AI, Network, Recording)
- Implementation plan
- Migration path
- File structure
- Benefits of design

**When to read:** Implementing multiplayer, replay system, or new AI types.

---

## Meta Documentation

### [TechStack.md](./TechStack.md) (~80 lines)
**Technologies and rationale**

- Engine technologies (TypeScript, Jest/Vitest)
- UI technologies (React, Zustand, Framer Motion, Tailwind, Vite)
- AI technologies (Fetch API, caching)
- Rationale for each choice

**When to read:** Technology decisions, setting up development environment.

---

### [ProjectStructure.md](./ProjectStructure.md) (~150 lines)
**File organization and development phases**

- Complete directory tree
- File organization philosophy
- Module responsibilities
- Development phases (8 phases with tasks)
- Implementation roadmap

**When to read:** Understanding codebase organization, planning development.

---

### [TestingStrategy.md](./TestingStrategy.md) (~150 lines)
**Testing approaches and patterns**

- Unit test examples
- Integration test examples
- Testing patterns
- Open questions (empty deck, hand size, etc.)
- Architecture summary & benefits

**When to read:** Writing tests, understanding testing philosophy.

---

## Quick Navigation

### By Task

- **Implementing a new card?** → [CardSystem.md](./CardSystem.md)
- **Understanding effects?** → [EffectSystem.md](./EffectSystem.md) + [EffectClasses.md](./EffectClasses.md)
- **Adding animation?** → [AnimationSystem.md](./AnimationSystem.md)
- **Building AI?** → [AISystem.md](./AISystem.md) + [PlayerController.md](./PlayerController.md)
- **UI component?** → [UIArchitecture.md](./UIArchitecture.md)
- **Game loop?** → [GameFlow.md](./GameFlow.md)

### By System

- **Core Engine:** EngineCore.md, EffectSystem.md, StateChecking.md
- **Cards:** CardSystem.md, EffectClasses.md, TargetingSystem.md
- **Events:** EventSystem.md, UIArchitecture.md
- **UI:** UIArchitecture.md, AnimationSystem.md
- **Game Systems:** GameFlow.md, AISystem.md, ReplaySystem.md, PlayerController.md
- **Project Info:** TechStack.md, ProjectStructure.md, TestingStrategy.md

---

## Related Documentation

- **Game Design** → [../Game Design/Index.md](../Game%20Design/Index.md)
  - Game rules that this architecture implements
- **UI Design** → [../UI Design/Index.md](../UI%20Design/Index.md)
  - Visual design for the UI layer

---

*This index covers all code architecture documentation. Load only the files you need for your current task.*
