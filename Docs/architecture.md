# Card Game - Technical Architecture Document (Hardcoded Implementation)

## Overview

This document outlines the high-level technical architecture for a card game engine designed to support:
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

## Core Systems

## 1. Game Rules Engine

### Responsibilities
- Maintain authoritative game state
- Validate player actions
- Execute card logic (hardcoded classes)
- Resolve effects via queue (FIFO)
- Check state-based conditions
- Emit events for all state changes

### Structure

```
GameEngine
├── GameState (current state snapshot)
│   ├── Players[2]
│   │   ├── Hand
│   │   ├── Deck
│   │   └── VP
│   ├── Slots[4]
│   │   ├── Units (per player)
│   │   └── Ongoing Effects
│   ├── Round info
│   └── Match info
│
├── ActionProcessor
│   ├── validateAction()
│   └── processAction()
│
├── EffectQueue (FIFO)
│   ├── enqueue(effect)
│   ├── processNext()
│   └── isEmpty()
│
├── StateChecker
│   ├── checkDeaths()
│   ├── checkWinConditions()
│   └── checkRoundEnd()
│
└── EventEmitter
    └── emit(event)
```

### Key Flow

**Action → State Transition:**
```
1. Player sends Action
2. Engine validates Action
3. Engine applies Action
   ↓ enqueues Effects
4. Engine processes Effect Queue
   ↓ each effect may enqueue more effects
5. Engine checks state-based conditions
   ↓ may enqueue more effects (deaths, etc.)
6. Repeat 4-5 until queue empty
7. Engine emits Events
8. UI updates from Events
```

---

## 2. Effect Queue System

### Purpose
Handle sequences of effects that may trigger other effects.

### Queue Structure (FIFO - First In, First Out)

```
Effect Queue:
┌─────────────────────────────┐
│ Effect 1: Deploy Scout      │ ← Process first
├─────────────────────────────┤
│ Effect 2: Draw 1 card       │ ← Process second
├─────────────────────────────┤
│ Effect 3: Unit deployed     │ ← Process third
└─────────────────────────────┘
```

**Why Queue (not Stack)?**
- More intuitive: effects resolve in play order
- Easier to understand for players
- Simpler to implement
- Matches Hearthstone's PowerTask system

### Processing Algorithm

```typescript
processAction(action: GameAction) {
  // Validate
  if (!this.isLegalAction(action)) {
    throw new Error('Illegal action');
  }
  
  // Create primary effect
  const primaryEffect = this.actionToEffect(action);
  this.effectQueue.enqueue(primaryEffect);
  
  // Process queue until empty
  while (!this.effectQueue.isEmpty()) {
    const effect = this.effectQueue.dequeue();
    
    // Execute effect
    const result = effect.execute(this.state);
    
    // Update state
    this.state = result.newState;
    
    // Emit events for UI
    result.events.forEach(e => this.emitEvent(e));
    
    // Check for triggered effects
    const triggered = this.checkTriggers(result.events);
    triggered.forEach(e => this.effectQueue.enqueue(e));
    
    // Check state-based conditions
    const stateEffects = this.checkStateConditions();
    stateEffects.forEach(e => this.effectQueue.enqueue(e));
  }
  
  return this.state;
}
```

### Example: Martyr Death Chain

**User action:** Play Champion to slot 1 (where Martyr is)

**Queue processing:**
1. Enqueue: PlayCardEffect(Champion, slot 1)
2. Process: PlayCardEffect
   - Check if slot occupied (yes, Martyr)
   - Enqueue: SacrificeUnitEffect(Martyr)
   - Enqueue: DeployUnitEffect(Champion)
3. Process: SacrificeUnitEffect(Martyr)
   - Remove Martyr from slot
   - Emit: UNIT_SACRIFICED event
   - Trigger Martyr.onDeath()
     - Martyr enqueues: ModifyPowerEffect(close allies, +2)
4. Process: DeployUnitEffect(Champion)
   - Place Champion in slot
   - Trigger Champion.onDeploy() (if any)
   - Emit: UNIT_DEPLOYED event
5. Process: ModifyPowerEffect(close allies, +2)
   - Find close allies (Scout at slot 2)
   - Scout.power += 2
   - Emit: UNIT_POWER_CHANGED event
6. Check state conditions
   - No units at 0 power
   - No win conditions met
7. Queue empty → Action complete

---

## 3. Card System (Hardcoded Classes)

### Why Hardcoded?
✅ **Fast prototyping** - write card logic directly  
✅ **Full control** - complex interactions easy  
✅ **Type safety** - TypeScript catches errors  
✅ **Better IDE support** - autocomplete, refactoring  
✅ **Easier debugging** - step through actual code  

❌ Designers need to code (acceptable for prototype)  
❌ Rebuild needed for changes (fast with Vite)

### Base Card Classes

```typescript
abstract class Card {
  id: string;          // Unique instance ID
  cardId: string;      // Card type ID
  name: string;
  owner: PlayerId;
  engine: GameEngine;  // Reference for emitting events
  
  abstract getType(): 'unit' | 'action';
}

abstract class UnitCard extends Card {
  power: number;
  originalPower: number;
  slotId: SlotId | null;
  
  getType() { return 'unit' as const; }
  
  // Lifecycle hooks (override in subclasses)
  onDeploy(): void {}
  onDeath(): void {}
  onConquer(): void {}
  onPowerChanged(oldPower: number, newPower: number): void {}
  
  // Helper methods
  addPower(amount: number): void {
    const oldPower = this.power;
    this.power += amount;
    
    this.engine.emitEvent({
      type: 'UNIT_POWER_CHANGED',
      unitId: this.id,
      slotId: this.slotId,
      oldPower,
      newPower: this.power,
      amount
    });
    
    this.onPowerChanged(oldPower, this.power);
  }
  
  dealDamage(amount: number): void {
    this.addPower(-amount);
    if (this.power < 0) this.power = 0;
  }
  
  getCloseAllies(): UnitCard[] {
    return this.engine.getCloseUnits(this.slotId, this.owner, 'ally');
  }
  
  getCloseEnemies(): UnitCard[] {
    return this.engine.getCloseUnits(this.slotId, this.owner, 'enemy');
  }
}

abstract class ActionCard extends Card {
  getType() { return 'action' as const; }
  
  // Actions must implement play logic
  abstract play(target?: any): void;
}
```

### Example Card Implementations

**Scout:**
```typescript
class Scout extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super();
    this.cardId = 'scout';
    this.name = 'Scout';
    this.power = 1;
    this.originalPower = 1;
    this.owner = owner;
    this.engine = engine;
  }
  
  onDeploy(): void {
    // Enqueue draw effect
    this.engine.effectQueue.enqueue(
      new DrawCardEffect(this.owner, 1)
    );
  }
}
```

**Martyr:**
```typescript
class Martyr extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super();
    this.cardId = 'martyr';
    this.name = 'Martyr';
    this.power = 2;
    this.originalPower = 2;
    this.owner = owner;
    this.engine = engine;
  }
  
  onDeath(): void {
    const allies = this.getCloseAllies();
    
    allies.forEach(ally => {
      // Each addPower() emits events automatically
      ally.addPower(2);
    });
  }
}
```

**Champion:**
```typescript
class Champion extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super();
    this.cardId = 'champion';
    this.name = 'Champion';
    this.power = 5;
    this.originalPower = 5;
    this.owner = owner;
    this.engine = engine;
  }
  
  // No special abilities, just a strong unit
}
```

**Bouncer:**
```typescript
class Bouncer extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super();
    this.cardId = 'bouncer';
    this.name = 'Bouncer';
    this.power = 2;
    this.originalPower = 2;
    this.owner = owner;
    this.engine = engine;
  }
  
  onDeploy(): void {
    const closeUnits = this.engine.getCloseUnits(
      this.slotId,
      this.owner,
      'any'
    ).filter(u => u.id !== this.id); // Can't bounce self
    
    if (closeUnits.length > 0) {
      // For now, bounce first close unit
      // TODO: Let player choose target
      const target = closeUnits[0];
      
      this.engine.effectQueue.enqueue(
        new BounceUnitEffect(target)
      );
      
      // If bounced ally, discard a card
      if (target.owner === this.owner) {
        this.engine.effectQueue.enqueue(
          new DiscardCardEffect(this.owner, 1)
        );
      }
    }
  }
}
```

**Fortify (Action):**
```typescript
class Fortify extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super();
    this.cardId = 'fortify';
    this.name = 'Fortify';
    this.owner = owner;
    this.engine = engine;
  }
  
  play(slotId: SlotId): void {
    // Add ongoing effect to slot
    const effect: SlotEffect = {
      id: generateId(),
      owner: this.owner,
      description: 'Deploy: Give this unit +2 power',
      trigger: 'deploy',
      effect: (unit: UnitCard) => {
        if (unit.owner === this.owner) {
          unit.addPower(2);
        }
      }
    };
    
    this.engine.addSlotEffect(slotId, effect);
    
    this.engine.emitEvent({
      type: 'SLOT_EFFECT_ADDED',
      slotId,
      effect: effect.description
    });
  }
}
```

### Card Registry

```typescript
// Simple factory for creating cards
const CardRegistry = {
  'scout': (owner, engine) => new Scout(owner, engine),
  'martyr': (owner, engine) => new Martyr(owner, engine),
  'champion': (owner, engine) => new Champion(owner, engine),
  'bouncer': (owner, engine) => new Bouncer(owner, engine),
  'fortify': (owner, engine) => new Fortify(owner, engine),
  // ... add more cards
};

function createCard(cardId: string, owner: PlayerId, engine: GameEngine): Card {
  const factory = CardRegistry[cardId];
  if (!factory) {
    throw new Error(`Unknown card: ${cardId}`);
  }
  return factory(owner, engine);
}
```

---

## 4. Effect Classes

### Purpose
Encapsulate game actions as objects that can be queued and executed.

### Base Effect Class

```typescript
abstract class Effect {
  abstract execute(state: GameState): EffectResult;
}

interface EffectResult {
  newState: GameState;
  events: GameEvent[];
}
```

### Common Effects

**PlayCardEffect:**
```typescript
class PlayCardEffect extends Effect {
  constructor(
    private playerId: PlayerId,
    private card: Card,
    private slotId?: SlotId
  ) {
    super();
  }
  
  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];
    
    // Remove from hand
    const player = state.players[this.playerId];
    player.hand = player.hand.filter(c => c.id !== this.card.id);
    
    events.push({
      type: 'CARD_PLAYED',
      playerId: this.playerId,
      cardId: this.card.cardId,
      slotId: this.slotId
    });
    
    if (this.card instanceof UnitCard && this.slotId !== undefined) {
      // Check if slot occupied
      const slot = state.slots[this.slotId];
      const existingUnit = slot.units[this.playerId];
      
      if (existingUnit) {
        // Enqueue sacrifice of existing unit
        this.card.engine.effectQueue.enqueue(
          new SacrificeUnitEffect(existingUnit)
        );
      }
      
      // Enqueue deploy
      this.card.engine.effectQueue.enqueue(
        new DeployUnitEffect(this.card, this.slotId)
      );
    } else if (this.card instanceof ActionCard) {
      // Actions play immediately
      this.card.play(this.slotId);
      player.discard.push(this.card);
    }
    
    return { newState: state, events };
  }
}
```

**DeployUnitEffect:**
```typescript
class DeployUnitEffect extends Effect {
  constructor(
    private unit: UnitCard,
    private slotId: SlotId
  ) {
    super();
  }
  
  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];
    const slot = state.slots[this.slotId];
    
    // Place unit
    slot.units[this.unit.owner] = this.unit;
    this.unit.slotId = this.slotId;
    
    events.push({
      type: 'UNIT_DEPLOYED',
      unitId: this.unit.id,
      slotId: this.slotId,
      playerId: this.unit.owner
    });
    
    // Trigger slot ongoing effects
    slot.ongoingEffects
      .filter(e => e.owner === this.unit.owner && e.trigger === 'deploy')
      .forEach(e => e.effect(this.unit));
    
    // Trigger unit's onDeploy
    this.unit.onDeploy();
    
    return { newState: state, events };
  }
}
```

**SacrificeUnitEffect:**
```typescript
class SacrificeUnitEffect extends Effect {
  constructor(private unit: UnitCard) {
    super();
  }
  
  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];
    const slot = state.slots[this.unit.slotId!];
    
    // Remove from slot
    slot.units[this.unit.owner] = null;
    
    // Add to discard
    const player = state.players[this.unit.owner];
    player.discard.push(this.unit);
    
    events.push({
      type: 'UNIT_SACRIFICED',
      unitId: this.unit.id,
      slotId: this.unit.slotId!
    });
    
    events.push({
      type: 'UNIT_DIED',
      unitId: this.unit.id,
      slotId: this.unit.slotId!,
      cause: 'sacrifice'
    });
    
    // Trigger death effects
    this.unit.onDeath();
    
    return { newState: state, events };
  }
}
```

**ModifyPowerEffect:**
```typescript
class ModifyPowerEffect extends Effect {
  constructor(
    private unit: UnitCard,
    private amount: number
  ) {
    super();
  }
  
  execute(state: GameState): EffectResult {
    // Unit.addPower() handles event emission
    this.unit.addPower(this.amount);
    
    return { newState: state, events: [] };
  }
}
```

**DrawCardEffect:**
```typescript
class DrawCardEffect extends Effect {
  constructor(
    private playerId: PlayerId,
    private count: number
  ) {
    super();
  }
  
  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];
    const player = state.players[this.playerId];
    
    for (let i = 0; i < this.count; i++) {
      if (player.deck.length === 0) break;
      
      const card = player.deck.pop()!;
      player.hand.push(card);
      
      events.push({
        type: 'CARD_DRAWN',
        playerId: this.playerId,
        cardId: card.cardId
      });
    }
    
    return { newState: state, events };
  }
}
```

---

## 5. Targeting System

### Purpose
Many cards require the player to select a target (unit, slot, etc.) before the effect can resolve.

### Examples That Need Targeting
- "Deal 3 damage to an enemy" → which enemy?
- "Bounce a close unit" → which close unit?
- "Give a slot +2 power ongoing" → which slot?

### Implementation Flow

**Two-Phase Play:**

```typescript
// Phase 1: Card Selection
player clicks card in hand
→ UI highlights valid targets
→ player clicks target
→ UI sends action with target info

// Phase 2: Effect Resolution
engine processes action with target
→ effect executes on specified target
→ events emitted
```

### Action Structure with Targets

```typescript
type GameAction =
  | { 
      type: 'PLAY_CARD';
      playerId: PlayerId;
      cardId: string;
      slotId?: SlotId;          // For unit cards
      targetUnitId?: string;    // For effects targeting units
      targetSlotId?: SlotId;    // For effects targeting slots
    }
  | { type: 'PASS'; playerId: PlayerId };
```

### Card Targeting Requirements

```typescript
abstract class Card {
  // ... existing properties
  
  // Override in cards that need targets
  needsTarget(): boolean {
    return false;  // Most cards don't need targets
  }
  
  getValidTargets(state: GameState): TargetInfo {
    return { type: 'none' };
  }
}

type TargetInfo =
  | { type: 'none' }
  | { type: 'unit'; validUnitIds: string[] }
  | { type: 'slot'; validSlotIds: SlotId[] }
  | { type: 'enemy_unit'; validUnitIds: string[] }
  | { type: 'ally_unit'; validUnitIds: string[] };
```

### Example: Damage Spell

```typescript
class Fireball extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super();
    this.cardId = 'fireball';
    this.name = 'Fireball';
    this.owner = owner;
    this.engine = engine;
  }
  
  needsTarget(): boolean {
    return true;
  }
  
  getValidTargets(state: GameState): TargetInfo {
    // Can target any enemy unit
    const enemyUnits = state.slots
      .flatMap(slot => slot.units)
      .filter(u => u && u.owner !== this.owner)
      .map(u => u!.id);
    
    return { type: 'enemy_unit', validUnitIds: enemyUnits };
  }
  
  play(targetUnitId: string): void {
    const target = this.engine.getUnitById(targetUnitId);
    if (!target) {
      throw new Error('Invalid target');
    }
    
    target.dealDamage(3);
  }
}
```

### UI Flow

```typescript
// In React component
function Hand({ cards, onCardPlay }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [validTargets, setValidTargets] = useState(null);
  
  const handleCardClick = (card) => {
    if (card.needsTarget()) {
      // Enter targeting mode
      setSelectedCard(card);
      const targets = card.getValidTargets(gameState);
      setValidTargets(targets);
      // UI highlights valid targets
    } else {
      // Play immediately (no target needed)
      onCardPlay(card.id);
    }
  };
  
  const handleTargetClick = (targetId) => {
    // Play card with target
    onCardPlay(selectedCard.id, { targetUnitId: targetId });
    setSelectedCard(null);
    setValidTargets(null);
  };
  
  return (
    <div>
      {cards.map(card => (
        <Card 
          key={card.id}
          card={card}
          onClick={() => handleCardClick(card)}
          selected={selectedCard?.id === card.id}
        />
      ))}
    </div>
  );
}
```

### Validation

```typescript
class GameEngine {
  processAction(action: GameAction): GameState {
    if (action.type === 'PLAY_CARD') {
      const card = this.getCardById(action.cardId);
      
      // Validate target if needed
      if (card.needsTarget()) {
        const validTargets = card.getValidTargets(this.state);
        const providedTarget = action.targetUnitId || action.targetSlotId;
        
        if (!providedTarget) {
          throw new Error('Card requires target');
        }
        
        if (!this.isValidTarget(providedTarget, validTargets)) {
          throw new Error('Invalid target');
        }
      }
      
      // ... continue processing
    }
  }
}
```

### Auto-Target Fallback (for AI)

```typescript
class Card {
  selectDefaultTarget(state: GameState): string | SlotId | null {
    const targets = this.getValidTargets(state);
    
    if (targets.type === 'enemy_unit' && targets.validUnitIds.length > 0) {
      // Pick first valid target
      return targets.validUnitIds[0];
    }
    
    // ... handle other target types
    
    return null;
  }
}

// AI uses this for simplicity
const target = card.selectDefaultTarget(state);
const action = {
  type: 'PLAY_CARD',
  cardId: card.id,
  targetUnitId: target
};
```

---

## 6. State-Based Condition Checking

### Purpose
Automatically enforce game rules after each effect resolves.

### Checks Performed

**After each effect:**
1. **Unit Deaths:** Any unit with power ≤ 0 dies
2. **Round End:** Both players passed consecutively
3. **Win Conditions:** Player has 2+ rounds won

### Implementation

```typescript
class StateChecker {
  checkStateConditions(state: GameState): Effect[] {
    const effects: Effect[] = [];
    
    // Check deaths
    effects.push(...this.checkDeaths(state));
    
    // Check round end
    if (this.shouldEndRound(state)) {
      effects.push(new EndRoundEffect());
    }
    
    // Check match end
    if (this.shouldEndMatch(state)) {
      effects.push(new EndMatchEffect());
    }
    
    return effects;
  }
  
  private checkDeaths(state: GameState): Effect[] {
    const deathEffects: Effect[] = [];
    
    for (const slot of state.slots) {
      for (const unit of slot.units) {
        if (unit && unit.power <= 0) {
          deathEffects.push(new DeathEffect(unit));
        }
      }
    }
    
    return deathEffects;
  }
  
  private shouldEndRound(state: GameState): boolean {
    return state.hasPassed[0] && state.hasPassed[1];
  }
  
  private shouldEndMatch(state: GameState): boolean {
    return state.roundsWon[0] >= 2 || state.roundsWon[1] >= 2;
  }
}
```

---

## 7. Event System

### Event Types

```typescript
type GameEvent =
  // Card events
  | { type: 'CARD_PLAYED'; playerId: PlayerId; cardId: string; slotId?: SlotId }
  | { type: 'CARD_DRAWN'; playerId: PlayerId; cardId: string }
  | { type: 'CARD_DISCARDED'; playerId: PlayerId; cardId: string }
  
  // Unit events
  | { type: 'UNIT_DEPLOYED'; unitId: string; slotId: SlotId; playerId: PlayerId }
  | { type: 'UNIT_DIED'; unitId: string; slotId: SlotId; cause: string }
  | { type: 'UNIT_SACRIFICED'; unitId: string; slotId: SlotId }
  | { type: 'UNIT_BOUNCED'; unitId: string; slotId: SlotId; toHand: boolean }
  | { type: 'UNIT_POWER_CHANGED'; unitId: string; slotId: SlotId; oldPower: number; newPower: number; amount: number }
  
  // Slot events
  | { type: 'SLOT_EFFECT_ADDED'; slotId: SlotId; effect: string }
  | { type: 'SLOT_EFFECT_REMOVED'; slotId: SlotId; effectId: string }
  
  // Round events
  | { type: 'ROUND_STARTED'; roundNumber: number }
  | { type: 'ROUND_ENDED'; roundNumber: number; winner: PlayerId | null }
  | { type: 'PLAYER_PASSED'; playerId: PlayerId }
  | { type: 'CONQUER_TRIGGERED'; unitId: string; slotId: SlotId }
  
  // Match events
  | { type: 'MATCH_ENDED'; winner: PlayerId }
  
  // State snapshot
  | { type: 'STATE_SNAPSHOT'; state: GameState };
```

### EventEmitter

```typescript
class EventEmitter {
  private listeners: Array<(event: GameEvent) => void> = [];
  
  subscribe(callback: (event: GameEvent) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  emit(event: GameEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }
}
```

### Usage in Engine

```typescript
class GameEngine {
  private eventEmitter = new EventEmitter();
  
  onEvent(callback: (event: GameEvent) => void): () => void {
    return this.eventEmitter.subscribe(callback);
  }
  
  emitEvent(event: GameEvent): void {
    this.eventEmitter.emit(event);
  }
  
  processAction(action: GameAction): GameState {
    // ... process action, emit events ...
    
    // Always emit state snapshot at end
    this.emitEvent({
      type: 'STATE_SNAPSHOT',
      state: this.state
    });
    
    return this.state;
  }
}
```

---

## 8. UI Layer (React)

### Responsibilities
- Listen to engine events
- Render game state
- Capture player input
- Play animations
- Display game log

### Key Principle: UI Never Touches Engine State

```typescript
// ❌ BAD
function Slot() {
  const unit = engine.state.slots[0].units[0];  // Direct access!
}

// ✅ GOOD
function Slot() {
  const [unit, setUnit] = useState(null);
  
  useEffect(() => {
    const unsubscribe = engine.onEvent(event => {
      if (event.type === 'UNIT_DEPLOYED') {
        setUnit(event.unit);
      }
    });
    return unsubscribe;
  }, []);
}
```

### State Management (Zustand)

```typescript
interface GameStore {
  engine: GameEngine | null;
  gameState: GameState | null;
  animationQueue: Animation[];
  
  initGame: (deck1: string[], deck2: string[]) => void;
  playCard: (cardId: string, slotId?: SlotId) => void;
  pass: () => void;
}

const useGameStore = create<GameStore>((set, get) => ({
  engine: null,
  gameState: null,
  animationQueue: [],
  
  initGame: (deck1, deck2) => {
    const engine = new GameEngine(deck1, deck2);
    
    // Subscribe to events
    engine.onEvent(event => {
      // Convert events to animations
      const animation = eventToAnimation(event);
      if (animation) {
        set(state => ({
          animationQueue: [...state.animationQueue, animation]
        }));
      }
      
      // Update state snapshot
      if (event.type === 'STATE_SNAPSHOT') {
        set({ gameState: event.state });
      }
    });
    
    set({ engine });
  },
  
  playCard: (cardId, slotId) => {
    const { engine, gameState } = get();
    if (!engine || !gameState) return;
    
    engine.processAction({
      type: 'PLAY_CARD',
      playerId: gameState.currentPlayer,
      cardId,
      slotId
    });
  },
  
  pass: () => {
    const { engine, gameState } = get();
    if (!engine || !gameState) return;
    
    engine.processAction({
      type: 'PASS',
      playerId: gameState.currentPlayer
    });
  }
}));
```

### Component Structure

```
App
├── GameSetup (deck builder, AI selection)
└── GameBoard
    ├── PlayerArea (top)
    │   ├── Hand
    │   │   └── Card (x8)
    │   └── SlotRow
    │       └── Slot (x4)
    │           └── Unit
    ├── InfoPanel (center)
    │   ├── VP Counter
    │   ├── Round Counter
    │   └── Pass Button
    ├── PlayerArea (bottom)
    │   ├── SlotRow
    │   │   └── Slot (x4)
    │   │       └── Unit
    │   └── Hand
    │       └── Card (x8)
    └── AnimationLayer
        └── AnimationQueue
```

---

## 9. Animation System

### Animation Queue

```typescript
interface Animation {
  id: string;
  type: string;
  duration: number;
  params: any;
}

class AnimationQueue {
  private queue: Animation[] = [];
  private isPlaying = false;
  
  add(animation: Animation): void {
    this.queue.push(animation);
    if (!this.isPlaying) {
      this.playNext();
    }
  }
  
  private async playNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }
    
    this.isPlaying = true;
    const animation = this.queue.shift()!;
    
    await this.playAnimation(animation);
    
    this.playNext();
  }
  
  private async playAnimation(animation: Animation): Promise<void> {
    // Trigger animation in UI
    // Wait for duration
    return new Promise(resolve => {
      setTimeout(resolve, animation.duration);
    });
  }
}
```

### Event to Animation Mapping

```typescript
function eventToAnimation(event: GameEvent): Animation | null {
  switch (event.type) {
    case 'CARD_PLAYED':
      return {
        id: generateId(),
        type: 'card_fly_to_slot',
        duration: 500,
        params: {
          cardId: event.cardId,
          slotId: event.slotId
        }
      };
      
    case 'UNIT_POWER_CHANGED':
      return {
        id: generateId(),
        type: 'power_buff',
        duration: 300,
        params: {
          unitId: event.unitId,
          amount: event.amount
        }
      };
      
    case 'UNIT_DIED':
      return {
        id: generateId(),
        type: 'unit_death',
        duration: 400,
        params: {
          unitId: event.unitId,
          effect: 'dissolve'
        }
      };
      
    // ... more mappings
    
    default:
      return null;
  }
}
```

### Animation Components (Framer Motion)

```typescript
function PowerBuffAnimation({ unitId, amount }: { unitId: string, amount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="power-buff"
    >
      +{amount}
    </motion.div>
  );
}

function UnitDeathAnimation({ unitId }: { unitId: string }) {
  return (
    <motion.div
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4 }}
      className="unit-death"
    />
  );
}
```

---

## 10. AI System

### AI Interface

```typescript
interface AIStrategy {
  name: string;
  selectAction(gameState: GameState, playerId: PlayerId): Promise<GameAction>;
}
```

### AI Controller

```typescript
class AIController {
  constructor(
    private engine: GameEngine,
    private strategy: AIStrategy,
    private playerId: PlayerId
  ) {}
  
  async takeTurn(): Promise<void> {
    const action = await this.strategy.selectAction(
      this.engine.state,
      this.playerId
    );
    
    this.engine.processAction(action);
  }
}
```

### Heuristic AI

```typescript
class HeuristicAI implements AIStrategy {
  name = 'Heuristic AI';
  
  async selectAction(state: GameState, playerId: PlayerId): Promise<GameAction> {
    const legalActions = this.getLegalActions(state, playerId);
    
    // Score each action
    const scored = legalActions.map(action => ({
      action,
      score: this.scoreAction(action, state)
    }));
    
    // Pick best
    const best = scored.reduce((a, b) => a.score > b.score ? a : b);
    
    return best.action;
  }
  
  private scoreAction(action: GameAction, state: GameState): number {
    let score = 0;
    
    if (action.type === 'PLAY_CARD') {
      // Prefer playing high power units
      const card = this.findCard(action.cardId, state);
      if (card instanceof UnitCard) {
        score += card.power * 10;
      }
      
      // Prefer contesting opponent slots
      if (action.slotId !== undefined) {
        const slot = state.slots[action.slotId];
        const opponentUnit = slot.units[1 - state.currentPlayer];
        if (opponentUnit) {
          score += 50; // Bonus for contesting
        }
      }
    }
    
    if (action.type === 'PASS') {
      // Only pass if winning
      const vp = this.calculateVP(state, state.currentPlayer);
      if (vp >= 3) {
        score += 100;
      } else {
        score -= 100;
      }
    }
    
    return score;
  }
}
```

### Claude AI

```typescript
class ClaudeAI implements AIStrategy {
  name = 'Claude AI';
  private apiKey: string;
  
  async selectAction(state: GameState, playerId: PlayerId): Promise<GameAction> {
    const prompt = this.buildPrompt(state, playerId);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    const data = await response.json();
    const actionJson = JSON.parse(data.content[0].text);
    
    return this.validateAndConvert(actionJson, state);
  }
  
  private buildPrompt(state: GameState, playerId: PlayerId): string {
    return `
You are playing a card game. Choose your action.

Game State:
${JSON.stringify(this.simplifyState(state), null, 2)}

Your hand:
${this.formatHand(state.players[playerId].hand)}

Respond with JSON:
{ "type": "PLAY_CARD", "cardId": "...", "slotId": 0 }
or
{ "type": "PASS" }
    `;
  }
}
```

---

## 11. Replay System

### Action Logger

```typescript
class ActionLogger {
  private log: ActionLogEntry[] = [];
  
  record(action: GameAction, timestamp: number): void {
    this.log.push({
      action,
      timestamp,
      turn: this.log.length + 1
    });
  }
  
  export(): ActionLog {
    return {
      gameId: generateId(),
      timestamp: Date.now(),
      actions: this.log
    };
  }
  
  save(filename: string): void {
    const data = JSON.stringify(this.export(), null, 2);
    // Save to file or localStorage
  }
}

interface ActionLog {
  gameId: string;
  timestamp: number;
  initialState?: GameState;
  actions: ActionLogEntry[];
}

interface ActionLogEntry {
  action: GameAction;
  timestamp: number;
  turn: number;
}
```

### Replay Player

```typescript
class ReplayPlayer {
  constructor(private engine: GameEngine) {}
  
  async playLog(log: ActionLog, speed: number = 1): Promise<void> {
    for (const entry of log.actions) {
      // Process action
      this.engine.processAction(entry.action);
      
      // Wait (respecting speed multiplier)
      const nextTimestamp = log.actions[log.actions.indexOf(entry) + 1]?.timestamp;
      if (nextTimestamp) {
        const delay = (nextTimestamp - entry.timestamp) / speed;
        await sleep(delay);
      }
    }
  }
}
```

### Integration with Engine

```typescript
class GameEngine {
  private actionLogger = new ActionLogger();
  
  processAction(action: GameAction): GameState {
    // Log action
    this.actionLogger.record(action, Date.now());
    
    // ... process action ...
    
    return this.state;
  }
  
  exportReplay(): ActionLog {
    return this.actionLogger.export();
  }
}
```

---

## 12. Deck Builder UI

### Features
- Card library with search/filter
- Drag-and-drop deck construction
- Real-time validation (25-30 cards, max 3 copies)
- Save/load decks
- Opponent AI selection
- Quick start game

### Component Structure

```typescript
function DeckBuilder() {
  const [playerDeck, setPlayerDeck] = useState<string[]>([]);
  const [opponentDeck, setOpponentDeck] = useState<string[]>([]);
  const [opponentAI, setOpponentAI] = useState<AIStrategy>(new HeuristicAI());
  
  const startGame = () => {
    useGameStore.getState().initGame(playerDeck, opponentDeck);
    // Navigate to game board
  };
  
  return (
    <div className="deck-builder">
      <CardLibrary onCardSelect={addToPlayerDeck} />
      <DeckList deck={playerDeck} onChange={setPlayerDeck} />
      <OpponentSelector 
        ai={opponentAI}
        onAIChange={setOpponentAI}
        deck={opponentDeck}
        onDeckChange={setOpponentDeck}
      />
      <button onClick={startGame}>Start Game</button>
    </div>
  );
}
```

---

## 13. Round Resolution & Game Flow

### Round Start Sequence

```typescript
class StartRoundEffect extends Effect {
  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];
    
    // Determine draw count
    const drawCount = state.currentRound === 1 ? 8 : 4;
    
    // Draw cards for both players
    for (let playerId = 0; playerId < 2; playerId++) {
      for (let i = 0; i < drawCount; i++) {
        this.engine.effectQueue.enqueue(
          new DrawCardEffect(playerId as PlayerId, 1)
        );
      }
    }
    
    // Reset pass flags
    state.hasPassed = [false, false];
    
    // Reset VP for this round
    state.players[0].vp = 0;
    state.players[1].vp = 0;
    
    // Determine starting player (random on round 1, alternates after)
    if (state.currentRound === 1) {
      state.currentPlayer = Math.random() < 0.5 ? 0 : 1;
    }
    // Priority stays with last player for subsequent rounds
    
    events.push({
      type: 'ROUND_STARTED',
      roundNumber: state.currentRound
    });
    
    return { newState: state, events };
  }
}
```

### Round Resolution Sequence

```typescript
class ResolveRoundEffect extends Effect {
  execute(state: GameState): EffectResult {
    const events: GameEvent[] = [];
    
    // STEP 1: Calculate slot winners
    for (let slotId = 0; slotId < 4; slotId++) {
      const slot = state.slots[slotId];
      const unit0 = slot.units[0];
      const unit1 = slot.units[1];
      
      if (unit0 && unit1) {
        // Both players have units - compare power
        if (unit0.power > unit1.power) {
          state.players[0].vp += 1;
          slot.winner = 0;
        } else if (unit1.power > unit0.power) {
          state.players[1].vp += 1;
          slot.winner = 1;
        } else {
          // Tie - no VP awarded
          slot.winner = null;
        }
      } else if (unit0) {
        // Only player 0 has unit
        state.players[0].vp += 1;
        slot.winner = 0;
      } else if (unit1) {
        // Only player 1 has unit
        state.players[1].vp += 1;
        slot.winner = 1;
      } else {
        // Empty slot - no VP
        slot.winner = null;
      }
      
      events.push({
        type: 'SLOT_RESOLVED',
        slotId,
        winner: slot.winner,
        unit0Power: unit0?.power || 0,
        unit1Power: unit1?.power || 0
      });
    }
    
    // STEP 2: Trigger Conquer effects (left to right)
    for (let slotId = 0; slotId < 4; slotId++) {
      const slot = state.slots[slotId];
      if (slot.winner !== null) {
        const winningUnit = slot.units[slot.winner];
        if (winningUnit) {
          events.push({
            type: 'CONQUER_TRIGGERED',
            unitId: winningUnit.id,
            slotId
          });
          
          // Execute onConquer
          winningUnit.onConquer();
        }
      }
    }
    
    // STEP 3: Determine round winner
    const vp0 = state.players[0].vp;
    const vp1 = state.players[1].vp;
    
    let roundWinner: PlayerId | null = null;
    
    if (vp0 > vp1) {
      roundWinner = 0;
      state.roundsWon[0] += 1;
    } else if (vp1 > vp0) {
      roundWinner = 1;
      state.roundsWon[1] += 1;
    } else {
      // Tie round
      state.tieRounds += 1;
    }
    
    events.push({
      type: 'ROUND_ENDED',
      roundNumber: state.currentRound,
      winner: roundWinner,
      vp: [vp0, vp1]
    });
    
    // STEP 4: Check match end conditions
    const matchWinner = this.checkMatchEnd(state);
    
    if (matchWinner !== undefined) {
      state.matchWinner = matchWinner;
      events.push({
        type: 'MATCH_ENDED',
        winner: matchWinner
      });
    } else {
      // STEP 5: Cleanup for next round
      this.cleanupRound(state);
      state.currentRound += 1;
      
      // Enqueue next round start
      this.engine.effectQueue.enqueue(new StartRoundEffect());
    }
    
    return { newState: state, events };
  }
  
  private checkMatchEnd(state: GameState): PlayerId | null | undefined {
    // 2 rounds won = victory
    if (state.roundsWon[0] >= 2) return 0;
    if (state.roundsWon[1] >= 2) return 1;
    
    // 1 win + 1 tie = victory
    if (state.roundsWon[0] === 1 && state.tieRounds >= 1) return 0;
    if (state.roundsWon[1] === 1 && state.tieRounds >= 1) return 1;
    
    // 2 ties = draw
    if (state.tieRounds >= 2) return null;
    
    // Continue playing
    return undefined;
  }
  
  private cleanupRound(state: GameState): void {
    // Move all units to discard (they don't "die", just cleanup)
    for (const slot of state.slots) {
      for (let playerId = 0; playerId < 2; playerId++) {
        const unit = slot.units[playerId];
        if (unit) {
          state.players[playerId].discard.push(unit);
          slot.units[playerId] = null;
        }
      }
      // Ongoing effects persist!
    }
    
    // Reset pass flags
    state.hasPassed = [false, false];
  }
}
```

### Priority & Turn System

```typescript
class GameEngine {
  processAction(action: GameAction): GameState {
    if (action.type === 'PLAY_CARD') {
      // ... process card play ...
      
      // Switch priority to opponent
      this.state.currentPlayer = (1 - this.state.currentPlayer) as PlayerId;
      
      this.emitEvent({
        type: 'PRIORITY_CHANGED',
        newPriority: this.state.currentPlayer
      });
    }
    
    if (action.type === 'PASS') {
      // Lock player out
      this.state.hasPassed[action.playerId] = true;
      
      this.emitEvent({
        type: 'PLAYER_PASSED',
        playerId: action.playerId
      });
      
      // Check if both passed
      if (this.state.hasPassed[0] && this.state.hasPassed[1]) {
        // Enqueue round resolution
        this.effectQueue.enqueue(new ResolveRoundEffect());
      } else {
        // Switch priority to opponent (who can keep playing)
        this.state.currentPlayer = (1 - this.state.currentPlayer) as PlayerId;
      }
    }
    
    return this.state;
  }
}
```

### Damage & Power System

**Power is permanent - no separate damage tracking:**

```typescript
class UnitCard extends Card {
  power: number;          // Current power
  originalPower: number;  // Base power (for healing)
  
  dealDamage(amount: number): void {
    this.power -= amount;
    if (this.power < 0) this.power = 0;
    
    this.engine.emitEvent({
      type: 'UNIT_DAMAGED',
      unitId: this.id,
      amount,
      newPower: this.power
    });
  }
  
  addPower(amount: number): void {
    this.power += amount;
    
    this.engine.emitEvent({
      type: 'UNIT_POWER_CHANGED',
      unitId: this.id,
      amount,
      newPower: this.power
    });
  }
  
  heal(amount: number): void {
    const oldPower = this.power;
    this.power = Math.min(this.power + amount, this.originalPower);
    const actualHealed = this.power - oldPower;
    
    if (actualHealed > 0) {
      this.engine.emitEvent({
        type: 'UNIT_HEALED',
        unitId: this.id,
        amount: actualHealed,
        newPower: this.power
      });
    }
  }
}
```

**Bounced units are fresh instances:**
- When bounced, unit returns to hand
- When replayed, it's a NEW card instance
- Fresh power (no damage memory)
- Fresh buffs (no buff memory)

### UI Display Rules

**Units on Battlefield:**
- Show **current power only** (not base)
- Damaged unit with 3/5 power shows as "3"
- Buffed unit with 7/5 power shows as "7"

**Cards in Hand:**
- Show **original power** as base stats
- "Champion - Power: 5"

**Slot Ongoing Effects:**
- Display as colored rectangles behind slots
- Show effect name
- Tooltip shows full effect text on hover
- Multiple effects stack vertically

---

## 14. Technology Stack

### Engine
- **Language:** TypeScript (type safety)
- **State:** Mutable objects (simpler than immutable for prototype)
- **Events:** Custom EventEmitter
- **Testing:** Jest/Vitest

### UI
- **Framework:** React 18+
- **State:** Zustand (lightweight, simple)
- **Animation:** Framer Motion
- **Styling:** Tailwind CSS
- **Build:** Vite

### AI
- **HTTP:** Fetch API
- **Rate Limiting:** Simple debounce
- **Caching:** Optional LRU cache

---

## Project Structure

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

## Testing Strategy

### Unit Tests
```typescript
describe('Martyr', () => {
  it('buffs close allies on death', () => {
    const engine = new GameEngine();
    const martyr = new Martyr(0, engine);
    const scout = new Scout(0, engine);
    
    // Setup
    engine.deployUnit(martyr, 1);
    engine.deployUnit(scout, 2);
    
    // Act
    engine.sacrificeUnit(martyr);
    
    // Assert
    expect(scout.power).toBe(3); // Was 1, now 3
  });
});
```

### Integration Tests
```typescript
describe('Gameplay', () => {
  it('plays full round correctly', () => {
    const engine = new GameEngine();
    
    // Player 0 plays Scout to slot 1
    engine.processAction({
      type: 'PLAY_CARD',
      playerId: 0,
      cardId: 'scout',
      slotId: 1
    });
    
    // Player 1 passes
    engine.processAction({
      type: 'PASS',
      playerId: 1
    });
    
    // Player 0 passes
    engine.processAction({
      type: 'PASS',
      playerId: 0
    });
    
    // Assert round ended, Player 0 won slot 1
    expect(engine.state.roundPhase).toBe('ended');
    expect(engine.state.players[0].vp).toBe(1);
  });
});
```

---

## Open Questions

1. **Empty Deck Handling:** What happens if player needs to draw but deck is empty?
   - Reshuffle discard into deck?
   - Lose the game?
   - Just skip the draw?

2. **Maximum Hand Size:** Is there a hand size limit?
   - Unlimited for now?
   - Discard down to X at round end?

3. **Ongoing Effect Limits:** Max effects per slot?
   - No limit for now
   - Test if stacking becomes problematic

4. **Card Metadata:** How much detail for cards?
   - Art: Required (image filename)
   - Flavor text: Later
   - Description: Auto-generated from code for now

5. **Animation Timing:** Fine-tune animation speeds
   - User control (1x, 2x, skip)?
   - Test and adjust during Phase 6

---

## Summary

This architecture provides:

✅ **Fast prototyping** - Hardcoded cards, no JSON parsing  
✅ **Type safety** - TypeScript catches errors  
✅ **Clean separation** - Engine ← events → UI  
✅ **Simple effect resolution** - Queue (FIFO), not stack  
✅ **Flexible AI** - Pluggable strategies  
✅ **Replayability** - Action logs  
✅ **Testability** - Engine independent of UI  
✅ **Future-proof** - Can port to game engine later  

The event-driven architecture ensures UI and engine are loosely coupled, making it easy to swap React for Unity/Godot/whatever later while keeping all game logic intact.

---

*Document Version: 2.0 (Hardcoded Implementation)*  
*Last Updated: 2024*