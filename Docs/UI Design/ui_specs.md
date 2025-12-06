# UI Specification & Design System (ui_spec.md)

## 1. Visual Identity & Theme

### Color Palette (Tailwind CSS)
**Concept:** "Tactile Paper." Warm, physical card feel with clear UI indicators.

*   **Card Body:** `bg-amber-50` (Pale parchment)
*   **Card Header/Footer:** `bg-amber-200` (Darker paper)
*   **Card Border:** `border-stone-800` (Ink black)
*   **Game Background:** `bg-stone-200` (Tabletop surface)
*   **Slots (Empty):** `bg-stone-300/50` border `border-stone-400`
*   **Positive/Buffs:** `text-green-700` or `bg-green-100`
*   **Negative/Damage:** `text-red-700` or `bg-red-100`
*   **Targeting Highlight:** `ring-4 ring-blue-400 border-blue-500 border-dashed`

### Typography
**Recommendation:** Use Google Fonts.
1.  **Headers/Card Names:** `Patrick Hand` (Matches your mockup's handwritten vibe).
2.  **UI/Tooltips:** `Nunito` or `Inter` (Clean readability for small text).

**Tailwind Config Additions:**
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

## 2. Interaction & Animation Specs (Framer Motion)

### Card Interactions (The "Hand Feel")
Cards in hand are displayed in a "Fanned" arc by default.

**Default State (In Hand):**
*   **Rotation:** Calculated based on index (e.g., -10deg to 10deg).
*   **Y-Offset:** Lower down (pushing into bottom edge).
*   **Z-Index:** Based on index (0 to 7).

**Hover State (The "Pop"):**
*   **Trigger:** Mouse enter.
*   **Y-Offset:** Move up `-40px` (Pop out of the fan).
*   **Rotation:** `0deg` (Straighten up).
*   **Scale:** `1.1` (Slight zoom).
*   **Z-Index:** `50` (Always on top of neighbors).
*   **Transition:** `type: "spring", stiffness: 300, damping: 20` (Snappy feel).

**Drag State:**
*   **Trigger:** On mouse down/drag.
*   **Scale:** `1.05`.
*   **Rotation:** Loose physics (follow velocity slightly).
*   **Cursor:** `grabbing`.
*   **Ghosting:** The original position in hand maintains a placeholder gap.

### Targeting Feedback
When a card is being dragged:
*   **Valid Slots:** Highlight with `border-blue-500` and `bg-blue-50/50`.
*   **Invalid Slots:** Dim or show `cursor-not-allowed`.
*   **Snap:** If dropped near a valid slot, snap into center. If dropped elsewhere, spring back to hand.

## 3. Component Styling

### The Card (`<Card />`)
*   **Shape:** `w-32 h-48 rounded-lg border-2 border-stone-800 shadow-md relative`.
*   **Content:**
    *   *Top:* Name in `font-hand font-bold text-lg border-b-2 border-stone-800 p-1 bg-amber-200`.
    *   *Middle:* Art placeholder (`bg-stone-300 flex-grow`).
    *   *Bottom:* Description text `p-2 text-xs font-ui leading-tight`.
    *   *Footer:* Power Circle `absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-orange-400 border-2 border-stone-800 flex items-center justify-center font-bold text-xl shadow-sm`.

### The Slot (`<Slot />`)
*   **Shape:** `w-36 h-52 rounded-xl border-2 border-dashed border-stone-400 flex flex-col items-center justify-center relative`.
*   **Slot Effects Tray:** A `div` absolute positioned at the bottom of the slot (`bottom-[-20px]`).
    *   Contains small pills: `bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full`.

### Tooltips
*   **Appearance:** Styled like a "sticky note" or sidebar panel.
*   **Font:** `font-ui` for readability.
*   **Behavior:** Appears instantly on hover (no delay) in the dedicated "Tooltip Helper" area defined in the mockup.

## 4. Turn & Priority System

### Turn Indicator
*   **Visual:** Vertical arrow icon positioned on the left side of the battlefield between player and opponent areas.
*   **Behavior:**
    *   Points **down** during player's turn
    *   Points **up** during opponent's turn
    *   **Animation:** Smooth transition when turn switches (moves vertically and rotates)
    *   Serves as clear indicator of whose priority is active

### Priority Flow
Players alternate taking priority each turn. No undo functionality in MVP.

## 5. Card Interaction System

### Hand Management
*   **Drag-and-Drop:** Players can rearrange cards within their hand by dragging
*   **Deployment:** Drag card from hand to own slot (blue dashed slots)
*   **Visual Feedback:** During drag, valid slots highlight with `border-blue-500` and `bg-blue-50/50`

### Targeting System (Click-to-Target)
*   **Deploy:** Drag-and-drop from hand to own slot
*   **Abilities:** Click card → valid targets highlight → click target
*   Prevents confusion between deploying vs. targeting enemy slots

## 6. Slot Bonus System

### Display Rules
*   **Location:** Shown in dedicated "Slot bonus" area on the right side panel
*   **Content:**
    *   Numeric bonuses (e.g., "+3", "-2")
    *   Keyword effects (Deploy, Death, etc.) - shows keyword name
*   **Stacking:** When multiple bonuses apply, show stack count (e.g., "x3")
*   **Tooltips:** Hovering shows full description of bonus/keyword in tooltip helper area

### Visual Style
*   Use pill-shaped badges: `bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full`
*   Stack indicator overlaid on stacked bonuses

## 7. Card Power States

Cards display their **final power** value with color coding:

### Power Color Rules
*   **Buffed (Above base):** `text-green-700`
    *   Example: 3-power unit in +3 fortified slot = green "5"
*   **Normal (At base):** Default text color (black/ink)
    *   Example: After taking damage that negates buffs = white "3"
*   **Damaged (Below base):** `text-red-700`
    *   Example: Unit with 3 base power taking 2 more damage = red "1"

### Calculation Display
Power shown is always: `base + buffs - damage`
Color determined by comparing final power to base power.