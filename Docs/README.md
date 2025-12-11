# Skirmish Documentation

## Overview
Skirmish is a 2-player tactical card game where players deploy units across 5 terrains in a best-of-3 match format. Players compete to control more terrains through strategic positioning, resource management, and powerful card abilities.

This documentation is organized into three main areas to minimize token usage when working with AI:
- **Index files** provide scope and navigation (50-100 lines)
- **Topic files** are focused and cohesive (100-350 lines each)
- **Cross-references** link related concepts only where there are true dependencies

---

## Documentation Areas

### 1. Game Design
Rules, mechanics, cards, and strategy for Skirmish.

**→ See [Game Design/Index.md](./Game%20Design/Index.md)**

**Key Documents:**
- **[CoreRules.md](./Game%20Design/CoreRules.md)** - Victory conditions, setup, match structure
- **[Gameplay.md](./Game%20Design/Gameplay.md)** - Turn structure, battlefield, card playing
- **[CardMechanics.md](./Game%20Design/CardMechanics.md)** - Keywords, effects, targeting
- **[CardCatalog.md](./Game%20Design/CardCatalog.md)** - Complete unit and action card list
- **[StrategyGuide.md](./Game%20Design/StrategyGuide.md)** - Tips, FAQs, design philosophy

### 2. Code Architecture
Technical architecture for the game engine, UI, and systems.

**→ See [Code Architecture/Index.md](./Code%20Architecture/Index.md)**

**Key Systems:**
- **[EngineCore.md](./Code%20Architecture/EngineCore.md)** - Game state & action processing
- **[EffectSystem.md](./Code%20Architecture/EffectSystem.md)** - Effect queue & resolution
- **[CardSystem.md](./Code%20Architecture/CardSystem.md)** - Card classes & implementations
- **[EventSystem.md](./Code%20Architecture/EventSystem.md)** - Event-driven architecture
- **[UIArchitecture.md](./Code%20Architecture/UIArchitecture.md)** - React & Zustand integration

### 3. UI Design
Visual design, interaction patterns, and component specifications.

**→ See [UI Design/Index.md](./UI%20Design/Index.md)**

**Key Documents:**
- **[VisualSystem.md](./UI%20Design/VisualSystem.md)** - Colors, typography, theme
- **[InteractionDesign.md](./UI%20Design/InteractionDesign.md)** - Animations & feedback
- **[ComponentSpecs.md](./UI%20Design/ComponentSpecs.md)** - Card, Slot, UI components

### 4. AI Integration
AI opponent system, API integrations, and game logging.

**→ See [AI Integration/Index.md](./AI%20Integration/Index.md)**

**Key Documents:**
- **[AIArchitecture.md](./AI%20Integration/AIArchitecture.md)** - Plugin system & interfaces
- **[ClaudeIntegration.md](./AI%20Integration/ClaudeIntegration.md)** - Claude API integration
- **[GameLogging.md](./AI%20Integration/GameLogging.md)** - Action logging with AI reasoning
- **[PromptEngineering.md](./AI%20Integration/PromptEngineering.md)** - Effective prompt design
- **[Testing.md](./AI%20Integration/Testing.md)** - AI testing strategies

### 5. Development milestones

**→ See [Milestones.md](./Milestones.md) For milestones.**

---

## Quick Start

**New to the game?**
Start with [CoreRules.md](./Game%20Design/CoreRules.md) to understand how to win and set up a match.

**Implementing a feature?**
Check the relevant architecture doc:
- New card → [CardSystem.md](./Code%20Architecture/CardSystem.md)
- New effect → [EffectSystem.md](./Code%20Architecture/EffectSystem.md)
- UI change → [UIArchitecture.md](./Code%20Architecture/UIArchitecture.md)
- Animation → [AnimationSystem.md](./Code%20Architecture/AnimationSystem.md)

**Designing UI?**
Start with [VisualSystem.md](./UI%20Design/VisualSystem.md) for colors and typography.

**Implementing AI?**
Check the AI integration docs:
- AI opponent → [AIArchitecture.md](./AI%20Integration/AIArchitecture.md)
- Logging → [GameLogging.md](./AI%20Integration/GameLogging.md)
- Prompts → [PromptEngineering.md](./AI%20Integration/PromptEngineering.md)

---

## Documentation Philosophy

These docs are structured to minimize token usage when working with AI:

1. **Load only what you need** - Each file covers one cohesive topic
2. **Index files guide navigation** - Quick lookups without loading everything
3. **Minimal cross-references** - Only where there are true dependencies
4. **Self-contained topics** - Each file can be read independently

This structure typically reduces token usage by 80-90% compared to loading monolithic documentation files.

---

*Version 3.0 - Modular Structure*
