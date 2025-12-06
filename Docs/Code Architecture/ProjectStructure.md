# Project Structure

## Directory Tree

```
/card-game
├── /src
│   ├── /engine
│   │   ├── GameEngine.ts
│   │   ├── GameState.ts
│   │   ├── EventEmitter.ts
│   │   ├── EffectQueue.ts
│   │   ├── StateChecker.ts
│   │   ├── /cards
│   │   │   ├── Card.ts (base classes)
│   │   │   ├── Scout.ts
│   │   │   ├── Martyr.ts
│   │   │   ├── Champion.ts
│   │   │   ├── Bouncer.ts
│   │   │   └── index.ts (registry)
│   │   ├── /effects
│   │   │   ├── Effect.ts (base)
│   │   │   ├── PlayCardEffect.ts
│   │   │   ├── DeployUnitEffect.ts
│   │   │   ├── SacrificeUnitEffect.ts
│   │   │   └── index.ts
│   │   └── /types.ts
│   │
│   ├── /ui
│   │   ├── /components
│   │   │   ├── GameBoard.tsx
│   │   │   ├── PlayerArea.tsx
│   │   │   ├── Slot.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Hand.tsx
│   │   │   └── AnimationLayer.tsx
│   │   ├── /store
│   │   │   └── gameStore.ts
│   │   └── App.tsx
│   │
│   ├── /ai
│   │   ├── AIController.ts
│   │   ├── AIStrategy.ts (interface)
│   │   ├── HeuristicAI.ts
│   │   ├── ClaudeAI.ts
│   │   └── promptBuilder.ts
│   │
│   ├── /replay
│   │   ├── ActionLogger.ts
│   │   ├── ReplayPlayer.ts
│   │   └── types.ts
│   │
│   └── /utils
│       ├── animations.ts
│       └── helpers.ts
│
├── /tests
│   ├── /engine
│   │   ├── GameEngine.test.ts
│   │   └── cards.test.ts
│   └── /integration
│       └── gameplay.test.ts
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Development Phases

### Phase 1: Core Engine (Days 1-3)
- [ ] TypeScript project setup
- [ ] GameEngine class skeleton
- [ ] GameState structure
- [ ] EffectQueue implementation
- [ ] Basic card classes (Scout, Martyr, Champion)
- [ ] PlayCardEffect, DeployUnitEffect
- [ ] Unit tests

### Phase 2: Event System (Days 3-4)
- [ ] EventEmitter implementation
- [ ] Event types defined
- [ ] Events emitted from effects
- [ ] Integration tests

### Phase 3: Basic UI (Days 4-6)
- [ ] React setup with Vite
- [ ] Zustand store
- [ ] GameBoard component
- [ ] Slot and Card components
- [ ] Manual 2-player mode (no AI)

### Phase 4: Game Flow (Days 6-8)
- [ ] Turn system (play, pass)
- [ ] Round resolution
- [ ] VP calculation
- [ ] Conquer triggers
- [ ] Match win conditions

### Phase 5: More Cards (Days 8-10)
- [ ] Ongoing effects system
- [ ] Fortify action card
- [ ] Bouncer implementation
- [ ] Death triggers working
- [ ] StateChecker for deaths

### Phase 6: Animation (Days 10-12)
- [ ] Animation queue
- [ ] Event-to-animation mapping
- [ ] Framer Motion animations
- [ ] Smooth transitions

### Phase 7: AI (Days 12-15)
- [ ] AI controller
- [ ] Heuristic AI
- [ ] Claude API integration
- [ ] AI vs AI mode

### Phase 8: Polish (Days 15-18)
- [ ] Deck builder UI
- [ ] Action logging
- [ ] Replay system
- [ ] Bug fixes
- [ ] Visual polish

---

**See Also:**
- [TechStack.md](./TechStack.md) - Technologies used
