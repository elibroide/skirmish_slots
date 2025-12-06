# Animation System

## Animation Queue

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

---

## Event to Animation Mapping

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

    default:
      return null;
  }
}
```

---

## Animation Components (Framer Motion)

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

**See Also:**
- [EventSystem.md](./EventSystem.md) - Events that trigger animations
- [UIArchitecture.md](./UIArchitecture.md) - Animation integration with UI
