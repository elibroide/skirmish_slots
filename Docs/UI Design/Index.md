# UI Design Documentation

## Overview
Skirmish's UI follows a "Tactile Paper" concept—warm, physical card feel with clear indicators. The design emphasizes readability, tactile feedback through animations, and intuitive interaction patterns.

**Design Philosophy:**
- Physical card game aesthetic (paper textures, warm colors)
- Clear visual hierarchy and game state indicators
- Smooth, spring-based animations for tactile feedback
- Accessibility through color coding and tooltips

---

## Documentation Structure

### [VisualSystem.md](./VisualSystem.md) (~80 lines)
**Colors, typography, and theme**

The visual foundation:
- Color palette (Tailwind CSS classes)
  - Card colors (amber paper tones)
  - Game background (stone tabletop)
  - Positive/negative indicators (green/red)
  - Targeting highlights (blue)
- Typography
  - Patrick Hand (handwritten feel for cards)
  - Nunito/Inter (clean UI text)
- Tailwind config extensions
- "Tactile Paper" concept

**When to read:** Setting up theme, choosing colors, implementing new components.

---

### [InteractionDesign.md](./InteractionDesign.md) (~120 lines)
**Animations, feedback, and interaction patterns**

How users interact with the game:
- Card interactions
  - Hand "fan" layout
  - Hover "pop" effect
  - Drag state and ghosting
  - Spring physics (Framer Motion specs)
- Targeting feedback
  - Valid slot highlighting
  - Invalid slot dimming
  - Snap behavior
- Turn indicator design
  - Vertical arrow (up/down)
  - Priority flow visualization
- Hand management
  - Drag-and-drop rearranging
  - Deployment to slots

**When to read:** Implementing card animations, adding hover effects, designing interaction flows.

---

### [ComponentSpecs.md](./ComponentSpecs.md) (~120 lines)
**Component-level styling and specifications**

Detailed component specifications:
- Card component
  - Shape, borders, shadows
  - Layout (header, art, description, power circle)
  - Styling classes
- Slot component
  - Shape and dashed borders
  - Slot effects tray (bottom pills)
  - Empty/occupied states
- Tooltips
  - Sticky note styling
  - Positioning (tooltip helper area)
  - Font and readability
- Slot bonus system
  - Display location (right panel)
  - Numeric bonuses and keywords
  - Stacking indicators
- Card power states
  - Color coding (green buffed, white normal, red damaged)
  - Final power calculation display

**When to read:** Building UI components, styling cards/slots, implementing power displays.

---

## Quick Navigation

### By Task

- **Choosing colors?** → [VisualSystem.md](./VisualSystem.md)
- **Card hover animation?** → [InteractionDesign.md](./InteractionDesign.md)
- **Styling a card?** → [ComponentSpecs.md](./ComponentSpecs.md)
- **Power display colors?** → [ComponentSpecs.md](./ComponentSpecs.md)
- **Slot effects UI?** → [ComponentSpecs.md](./ComponentSpecs.md)

### By Component

- **Card:** ComponentSpecs.md (structure) + InteractionDesign.md (animations)
- **Slot:** ComponentSpecs.md (structure + effects tray)
- **Hand:** InteractionDesign.md (fan layout, drag-drop)
- **Turn Indicator:** InteractionDesign.md (arrow, priority)
- **Tooltips:** ComponentSpecs.md (styling, positioning)

---

## Design Tokens Reference

### Color Palette (Quick Reference)
```css
/* Cards */
bg-amber-50        /* Card body (pale parchment) */
bg-amber-200       /* Card header/footer */
border-stone-800   /* Ink black borders */

/* Game Board */
bg-stone-200       /* Tabletop surface */
bg-stone-300/50    /* Empty slots */

/* Indicators */
text-green-700     /* Buffs/positive */
text-red-700       /* Damage/negative */
ring-blue-400      /* Targeting highlight */
```

### Typography (Quick Reference)
```css
font-hand          /* Patrick Hand - card names */
font-ui            /* Nunito - UI text */
```

### Animation Specs (Quick Reference)
```javascript
// Spring config for card hover
{ type: "spring", stiffness: 300, damping: 20 }

// Card hover transform
{ y: -40, rotate: 0, scale: 1.1 }
```

---

## Related Documentation

- **Code Architecture** → [../Code Architecture/Index.md](../Code%20Architecture/Index.md)
  - [UIArchitecture.md](../Code%20Architecture/UIArchitecture.md) - React implementation
  - [AnimationSystem.md](../Code%20Architecture/AnimationSystem.md) - Animation queue
- **Game Design** → [../Game Design/Index.md](../Game%20Design/Index.md)
  - Understanding game mechanics being visualized

---

## Visual References

- **[GameLayout.png](./GameLayout.png)** - Original mockup showing layout and spacing

---

*This index covers all UI design documentation. Load only the files you need for your current task.*
