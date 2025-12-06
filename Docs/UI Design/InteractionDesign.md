# Interaction Design

## Card Interactions

### Hand "Fan" Layout

**Default State (In Hand):**
- **Rotation:** Calculated based on index (e.g., -10deg to 10deg)
- **Y-Offset:** Lower down (pushing into bottom edge)
- **Z-Index:** Based on index (0 to 7)

**Hover State (The "Pop"):**
- **Y-Offset:** Move up `-40px` (Pop out of the fan)
- **Rotation:** `0deg` (Straighten up)
- **Scale:** `1.1` (Slight zoom)
- **Z-Index:** `50` (Always on top of neighbors)
- **Transition:** `type: "spring", stiffness: 300, damping: 20` (Snappy feel)

**Drag State:**
- **Scale:** `1.05`
- **Rotation:** Loose physics (follow velocity slightly)
- **Cursor:** `grabbing`
- **Ghosting:** The original position in hand maintains a placeholder gap

---

## Framer Motion Specs

### Spring Configuration

```javascript
const cardHoverSpring = {
  type: "spring",
  stiffness: 300,
  damping: 20
};
```

### Card Hover Transform

```javascript
const hoverAnimation = {
  y: -40,
  rotate: 0,
  scale: 1.1
};
```

---

## Card Deployment (Drag-and-Drop)

**Valid Drop Slots:**
- Highlight player's own slots with `border-blue-500` and `bg-blue-50/50`
- Only player's own slots are valid drop targets for deployment

**Invalid Slots:**
- Dim or show `cursor-not-allowed`

**Snap Behavior:**
- If dropped near a valid slot, snap into center
- If dropped elsewhere, spring back to hand

**ALL Cards Use Drag-and-Drop:**
- No click-to-play pattern
- Units and actions both use drag-and-drop

---

## Input Request System (Post-Deploy Targeting)

### Overview

After deploying certain cards (e.g., Archer), the game **pauses execution** and requests target selection via the async input system.

### Visual Feedback

**When Targeting Active:**
- Valid target slots get **yellow/amber border** highlighting
- `cursor-pointer` on valid targets
- `cursor-not-allowed` on invalid targets
- Game interactions disabled until target selected
- No cancel option - player must select

**Slot Highlighting:**
```typescript
isTargetable={isAwaitingInput &&
              pendingInputRequest?.type === 'target' &&
              unit !== null &&
              pendingInputRequest.validTargetIds.includes(unit.id)}
```

### User Flow Example (Archer)

1. **Deploy:** Player drags Archer from hand to slot → card deploys
2. **Pause:** Archer's `onDeploy()` calls `await requestInput()`
3. **Highlight:** UI highlights valid enemy slots (close enemies) with yellow border
4. **Select:** Player clicks highlighted enemy slot
5. **Resume:** Engine resolves Promise, damage applies, game continues

### No Cancel Policy

- Player **must** select a valid target
- Ensures game state consistency
- No "escape" or "cancel" option
- If no valid targets exist, ability is skipped automatically

---

## Turn Indicator

### Visual
- **Icon:** Vertical arrow
- **Position:** Left side of battlefield between player areas

### Behavior
- Points **down** during player's turn
- Points **up** during opponent's turn
- **Animation:** Smooth transition (moves vertically and rotates)

---

## Hand Management

### Drag-and-Drop
- Players can drag cards from hand to own slot
- ALL cards use drag-and-drop (no click-to-play)
- Cards can be rearranged within hand (optional future feature)

### Visual Feedback
- During drag, valid slots highlight (blue border)
- Invalid slots dim
- Card returns to hand with spring animation if dropped elsewhere

---

## Interaction Patterns Summary

### Card Deployment (Drag-and-Drop)
- **Action:** Drag card from hand → drop on own slot
- **Applies To:** ALL cards (units and actions)
- **Pattern:** Drag-and-drop only, no click-to-select

### Target Selection (Click-on-Slot)
- **Action:** Click on highlighted slot containing target unit
- **Applies To:** Cards with Deploy/Death/Activate abilities requiring targets
- **When:** AFTER deployment, triggered by async input request
- **Pattern:** Click-to-select from highlighted options

### Key Differences

| Phase | Interaction | Target Slots | Visual Cue |
|-------|------------|--------------|-----------|
| **Deployment** | Drag-and-drop | YOUR slots only | Blue highlight |
| **Targeting** | Click-on-slot | ANY highlighted slot | Yellow/amber highlight |

---

## Future Input Types

The async input system supports extensible input types:

### Modal Choices
```typescript
{
  type: 'modal_choice';
  choices: ['Draw 2 cards', 'Gain +2 power'];
  context: 'Mystic Deploy ability';
}
```

**UI:** Display modal with buttons for each choice

### Number Selection
```typescript
{
  type: 'number_select';
  min: 1;
  max: 5;
  context: 'Select damage amount';
}
```

**UI:** Display slider or number picker

---

**See Also:**
- [VisualSystem.md](./VisualSystem.md) - Colors and fonts
- [ComponentSpecs.md](./ComponentSpecs.md) - Component styling
- [InputSystem.md](../Code Architecture/InputSystem.md) - Async input request architecture
