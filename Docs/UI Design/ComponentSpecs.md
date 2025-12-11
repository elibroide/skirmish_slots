# Component Specs

## The Card Component

### Shape & Structure

**Dimensions:** `w-32 h-48`
**Border:** `rounded-lg border-2 border-stone-800 shadow-md relative`

**Content Layout:**
1. **Top:** Name
   - `font-hand font-bold text-lg`
   - `border-b-2 border-stone-800 p-1`
   - `bg-amber-200`

2. **Middle:** Art placeholder
   - `bg-stone-300 flex-grow`

3. **Bottom:** Description text
   - `p-2 text-xs font-ui leading-tight`

4. **Footer:** Power Circle
   - `absolute -bottom-3 -right-3`
   - `w-10 h-10 rounded-full`
   - `bg-orange-400 border-2 border-stone-800`
   - `flex items-center justify-center`
   - `font-bold text-xl shadow-sm`

---

## The Slot Component

### Shape & Structure

**Dimensions:** `w-36 h-52`
**Border:** `rounded-xl border-2 border-dashed border-stone-400`
**Layout:** `flex flex-col items-center justify-center relative`

### Slot Effects Tray

**Position:** `bottom-[-20px]` (absolute)
**Pills:** `bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full`

---

## Tooltips

### Styling
- **Appearance:** Styled like a "sticky note" or sidebar panel
- **Font:** `font-ui` for readability
- **Behavior:** Appears instantly on hover (no delay)
- **Location:** Dedicated "Tooltip Helper" area

---

## Slot Bonus System

### Display Rules

**Location:** Badge positioned on the slot itself (closer to player's side)
- **Player (Bottom):** Badge at bottom of slot
- **Opponent (Top):** Badge at top of slot

**Content:**
- Numeric bonuses (e.g., "+3", "-2")
- Keyword effects (Deploy, Death, etc.) - shows keyword name

**Stacking:**
- When multiple bonuses apply, show stack count (e.g., "x3")

**Tooltips:**
- Hovering shows full description in tooltip helper area

### Visual Style

**Pills:** `bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full`
**Stack Indicator:** Overlaid on stacked bonuses

---

## Card Power States

### Power Color Rules

**Buffed (Above base):** `text-green-700`
- Example: 3-power unit in +3 fortified slot = green "6"

**Normal (At base):** Default text color (black/ink)
- Example: After taking damage that negates buffs = black "3"

**Damaged (Below base):** `text-red-700`
- Example: Unit with 3 base power taking 2 damage = red "1"

### Calculation Display

**Power shown:** Always `base + buffs - damage`
**Color:** Determined by comparing final power to base power

---

**See Also:**
- [VisualSystem.md](./VisualSystem.md) - Color palette
- [InteractionDesign.md](./InteractionDesign.md) - Animations
