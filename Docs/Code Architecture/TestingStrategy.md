# Testing Strategy

## Unit Tests

### Example: Martyr Death Effect

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
    expect(scout.power).toBe(4); // Was 2, now 4 (+2 from Martyr)
  });
});
```

---

## Integration Tests

### Example: Full Round

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

**See Also:**
- [EngineCore.md](./EngineCore.md) - What to test
- [CardSystem.md](./CardSystem.md) - Card implementations to test
