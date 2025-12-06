# Visual System

## Color Palette

**Concept:** "Tactile Paper" - Warm, physical card feel with clear UI indicators.

### Tailwind CSS Classes

**Cards:**
- `bg-amber-50` - Card body (pale parchment)
- `bg-amber-200` - Card header/footer (darker paper)
- `border-stone-800` - Ink black borders

**Game Board:**
- `bg-stone-200` - Tabletop surface
- `bg-stone-300/50` - Empty slots
- `border-stone-400` - Slot borders

**Indicators:**
- `text-green-700` or `bg-green-100` - Positive/Buffs
- `text-red-700` or `bg-red-100` - Negative/Damage
- `ring-4 ring-blue-400 border-blue-500 border-dashed` - Targeting highlight

---

## Typography

### Font Recommendations

**Google Fonts:**

1. **Patrick Hand** - Headers/Card Names
   - Handwritten vibe
   - Matches mockup aesthetic
   - Good readability

2. **Nunito** or **Inter** - UI/Tooltips
   - Clean readability
   - Professional
   - Good for small text

---

## Tailwind Config Extensions

```javascript
extend: {
  fontFamily: {
    'hand': ['"Patrick Hand"', 'cursive'],
    'ui': ['"Nunito"', 'sans-serif'],
  },
  colors: {
    'paper': '#fdfbf7',
    'ink': '#292524',
  }
}
```

---

**See Also:**
- [ComponentSpecs.md](./ComponentSpecs.md) - How to apply these colors
