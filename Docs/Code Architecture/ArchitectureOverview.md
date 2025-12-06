# Architecture Overview

## Document Purpose

This document outlines the high-level technical architecture for Skirmish's game engine. The architecture is designed to support:
- Hardcoded card classes in TypeScript (fast iteration, full control)
- Event-driven UI updates (clean separation)
- Queue-based effect resolution (simple, intuitive)
- AI opponent integration (pluggable strategies)
- Replay and debugging capabilities (action logs)
- Future portability (React → game engine)

---

## Architecture Philosophy

### Core Principle: Event-Driven Separation

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

**Golden Rule:** UI never directly accesses or modifies engine state. UI = f(events).

---

## Design Goals

### 1. Fast Prototyping
- **Hardcoded Cards:** Write card logic directly in TypeScript
- **No JSON Parsing:** Cards are classes, not data
- **Quick Iteration:** Change → compile → test (fast with Vite)

**Trade-off:** Designers need to code (acceptable for prototype)

---

### 2. Type Safety
- **TypeScript Throughout:** Compile-time error catching
- **Strong Typing:** GameState, Actions, Events all typed
- **Better IDE Support:** Autocomplete, refactoring, go-to-definition

**Benefit:** Fewer runtime errors, easier refactoring

---

### 3. Clean Separation
- **Engine:** Pure game logic, no UI dependencies
- **UI:** Pure presentation, listens to events
- **Unidirectional Flow:** Engine → Events → UI → Actions → Engine

**Benefit:** Can swap UI (React → Unity) without touching engine

---

## System Diagram

```
┌────────────────────────────────────────────────┐
│              GAME ENGINE (TypeScript)          │
│                                                │
│  ┌──────────────┐     ┌──────────────┐       │
│  │  GameState   │────▶│ActionProcessor│       │
│  └──────────────┘     └───────┬──────┘       │
│                               │               │
│                               ▼               │
│                       ┌──────────────┐        │
│                       │ EffectQueue  │        │
│                       │   (FIFO)     │        │
│                       └───────┬──────┘        │
│                               │               │
│                               ▼               │
│                      ┌──────────────┐         │
│                      │StateChecker  │         │
│                      └───────┬──────┘         │
│                              │                │
│                              ▼                │
│                     ┌──────────────┐          │
│                     │EventEmitter  │          │
│                     └───────┬──────┘          │
└─────────────────────────────┼─────────────────┘
                              │ Events
                              ▼
┌─────────────────────────────┴─────────────────┐
│             UI LAYER (React)                  │
│                                               │
│  ┌──────────────┐     ┌──────────────┐      │
│  │ GameStore    │────▶│  Components  │      │
│  │  (Zustand)   │     │   (React)    │      │
│  └───────┬──────┘     └──────────────┘      │
│          │                                    │
│          ▼                                    │
│  ┌──────────────┐                            │
│  │AnimationQueue│                            │
│  └──────────────┘                            │
└────────────────────────────────────────────────┘
```

---

## Key Architectural Decisions

### 1. Hardcoded vs Data-Driven Cards

**Decision:** Hardcoded card classes

**Rationale:**
- Faster to write complex logic
- Better type safety
- Easier debugging
- IDE support (autocomplete, refactoring)

**Trade-off:** Need rebuild to change cards (fast with Vite)

---

### 2. FIFO Queue vs Stack

**Decision:** FIFO (First In, First Out) queue

**Rationale:**
- More intuitive for players
- Effects resolve in play order
- Easier to reason about
- Matches Hearthstone's PowerTask system

**Alternative:** Stack (LIFO) would be more Magic-like but less intuitive

---

### 3. Event-Driven UI

**Decision:** Engine emits events, UI listens

**Rationale:**
- Clean separation of concerns
- Easy to add multiple UIs (web, desktop, mobile)
- Can port to game engine later
- Testable (engine has no UI dependencies)

**Benefit:** UI is pure function of events

---

### 4. Mutable State

**Decision:** Mutable objects in engine

**Rationale:**
- Simpler for prototype
- Faster than immutable
- Easier to understand
- Good enough for single-player/local multiplayer

**Trade-off:** More complex in networked multiplayer (future concern)

---

## Benefits of This Architecture

✅ **Fast Prototyping**
- Hardcoded cards, no JSON parsing
- Write logic directly

✅ **Type Safety**
- TypeScript catches errors at compile time
- Refactoring is safe

✅ **Clean Separation**
- Engine ← events → UI
- Can swap UI implementation

✅ **Simple Effect Resolution**
- Queue (FIFO), not stack
- Intuitive order

✅ **Flexible AI**
- Pluggable strategies
- Easy to add new AI types

✅ **Replayability**
- Action logs enable replay
- Debugging tool

✅ **Testability**
- Engine independent of UI
- Easy to unit test

✅ **Future-Proof**
- Can port to game engine later
- Engine logic stays intact

---

## What This Architecture Does NOT Provide

❌ **Networked Multiplayer** (yet)
- Would need server authority
- Immutable state might be better
- Future consideration

❌ **Designer-Friendly Card Editor** (yet)
- Designers must code
- Could build JSON editor later
- Acceptable for prototype

❌ **Mobile Optimizations** (yet)
- React works on mobile
- May need native later
- Future consideration

---

*For detailed system implementations, see the other architecture documents in this folder.*

**See Also:**
- [EngineCore.md](./EngineCore.md) - Game state and action processing
- [EffectSystem.md](./EffectSystem.md) - Effect queue implementation
- [EventSystem.md](./EventSystem.md) - Event emitter and subscriptions
