# Card System

## Why Hardcoded?

**Decision:** Hardcoded card classes in TypeScript

### Advantages

✅ **Fast prototyping** - write card logic directly  
✅ **Full control** - complex interactions easy  
✅ **Type safety** - TypeScript catches errors  
✅ **Better IDE support** - autocomplete, refactoring  
✅ **Easier debugging** - step through actual code  

### Trade-offs

❌ Designers need to code (acceptable for prototype)  
❌ Rebuild needed for changes (fast with Vite)

---

## Base Card Classes

### Card (Abstract Base)

```typescript
abstract class Card {
  id: string;          // Unique instance ID
  cardId: string;      // Card type ID
  name: string;
  owner: PlayerId;
  engine: GameEngine;  // Reference for emitting events
  
  abstract getType(): 'unit' | 'action';
}
```

---

### UnitCard (Abstract)

```typescript
abstract class UnitCard extends Card {
  power: number;
  originalPower: number;
  slotId: SlotId | null;

  getType() { return 'unit' as const; }

  // Lifecycle hooks (override in subclasses)
  // Note: async to support input requests mid-execution
  async onDeploy(): Promise<void> {}
  async onDeath(): Promise<void> {}
  async onConquer(): Promise<void> {}
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
```

---

### ActionCard (Abstract)

```typescript
abstract class ActionCard extends Card {
  getType() { return 'action' as const; }
  
  // Actions must implement play logic
  abstract play(target?: any): void;
}
```

---

## Example Card Implementations

### Scout

```typescript
class Scout extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super();
    this.cardId = 'scout';
    this.name = 'Scout';
    this.power = 2;
    this.originalPower = 2;
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

---

### Martyr

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

---

### Champion

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

---

### Bouncer

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

---

### Engineer

```typescript
class Engineer extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super();
    this.cardId = 'engineer';
    this.name = 'Engineer';
    this.power = 1;
    this.originalPower = 1;
    this.owner = owner;
    this.engine = engine;
  }
  
  // Ongoing effect handled by turn start trigger
  // Not in onDeploy - needs to persist
}
```

**Note:** Ongoing effects like Engineer are handled by the engine's turn start phase, not in the card class directly.

---

### Archer

```typescript
class Archer extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super();
    this.cardId = 'archer';
    this.name = 'Archer';
    this.power = 3;
    this.originalPower = 3;
    this.owner = owner;
    this.engine = engine;
  }

  async onDeploy(): Promise<void> {
    const closeEnemies = this.getCloseEnemies();

    if (closeEnemies.length === 0) {
      return;
    }

    // Request player to select target
    const targetId = await this.requestInput({
      type: 'target',
      targetType: 'enemy_unit',
      validTargetIds: closeEnemies.map(u => u.id),
      context: 'Archer Deploy ability',
    });

    const target = this.engine.getUnitById(targetId);
    if (target) {
      target.dealDamage(2);
    }
  }
}
```

---

### Roots

```typescript
class Roots extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super();
    this.cardId = 'roots';
    this.name = 'Roots';
    this.power = 2;
    this.originalPower = 2;
    this.owner = owner;
    this.engine = engine;
  }
  
  onDeath(): void {
    // Add slot modifier equal to power
    const slot = this.engine.state.slots[this.slotId!];
    
    slot.modifiers[this.owner] = 
      (slot.modifiers[this.owner] || 0) + this.power;
    
    this.engine.emitEvent({
      type: 'SLOT_MODIFIER_ADDED',
      slotId: this.slotId!,
      playerId: this.owner,
      amount: this.power
    });
  }
}
```

---

### Noble

```typescript
class Noble extends UnitCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super();
    this.cardId = 'noble';
    this.name = 'Noble';
    this.power = 4;
    this.originalPower = 4;
    this.owner = owner;
    this.engine = engine;
  }
  
  onConquer(): void {
    // Draw 2 cards
    this.engine.effectQueue.enqueue(
      new DrawCardEffect(this.owner, 2)
    );
  }
}
```

---

## Action Card Examples

### Fortify

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

---

### Strike

```typescript
class Strike extends ActionCard {
  constructor(owner: PlayerId, engine: GameEngine) {
    super();
    this.cardId = 'strike';
    this.name = 'Strike';
    this.owner = owner;
    this.engine = engine;
  }
  
  needsTarget(): boolean {
    return true;
  }
  
  getValidTargets(state: GameState): TargetInfo {
    // Can target any unit
    const allUnits = state.slots
      .flatMap(slot => slot.units)
      .filter(u => u !== null)
      .map(u => u!.id);
    
    return { type: 'unit', validUnitIds: allUnits };
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

---

### Fireball

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
    // Can target any slot
    return { type: 'slot', validSlotIds: [0, 1, 2, 3, 4] };
  }
  
  play(slotId: SlotId): void {
    const slot = this.engine.state.slots[slotId];
    
    // Damage unit on slot
    for (const unit of slot.units) {
      if (unit) {
        unit.dealDamage(2);
      }
    }
    
    // Damage close units
    const closeSlotIds = this.engine.getCloseSlots(slotId);
    for (const closeSlotId of closeSlotIds) {
      const closeSlot = this.engine.state.slots[closeSlotId];
      for (const unit of closeSlot.units) {
        if (unit) {
          unit.dealDamage(2);
        }
      }
    }
  }
}
```

---

## Card Registry

### Factory Pattern

```typescript
// Simple factory for creating cards
const CardRegistry = {
  'scout': (owner, engine) => new Scout(owner, engine),
  'martyr': (owner, engine) => new Martyr(owner, engine),
  'champion': (owner, engine) => new Champion(owner, engine),
  'bouncer': (owner, engine) => new Bouncer(owner, engine),
  'fortify': (owner, engine) => new Fortify(owner, engine),
  'archer': (owner, engine) => new Archer(owner, engine),
  'roots': (owner, engine) => new Roots(owner, engine),
  'noble': (owner, engine) => new Noble(owner, engine),
  'strike': (owner, engine) => new Strike(owner, engine),
  'fireball': (owner, engine) => new Fireball(owner, engine),
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

## Lifecycle Hooks Reference

### async onDeploy(): Promise<void>
**When:** Unit enters play
**Use For:** Deploy effects (draw, damage, etc.)
**Async:** Yes - can request player input
**Example:** Scout draws a card, Archer requests target selection

### async onDeath(): Promise<void>
**When:** Unit is removed from play
**Use For:** Death effects (buff allies, slot modifiers)
**Async:** Yes - can request player input
**Example:** Martyr buffs close allies

### async onConquer(): Promise<void>
**When:** Unit wins its terrain during resolution
**Use For:** Reward effects (draw cards, gain power)
**Async:** Yes - can request player input
**Example:** Noble draws 2 cards

### onPowerChanged(oldPower, newPower): void
**When:** Unit's power changes
**Use For:** React to buffs/damage
**Async:** No - synchronous only
**Example:** Vampire gains power when damaged nearby

---

**See Also:**
- [CardMechanics.md](../Game Design/CardMechanics.md) - Game rules for cards
- [EffectSystem.md](./EffectSystem.md) - How effects resolve
- [InputSystem.md](./InputSystem.md) - Async input requests for targeting/choices
