# Territory Control Card Game - Design Document

## Overview
A 2-player competitive deck-building card game where players battle for control of four slots across multiple rounds using strategic card placement, ongoing slot effects, and resource management.

---

## Core Game Structure

### Victory Conditions
- **Match Format:** Best of 3 rounds
- **Match Winner:** First player to win 2 rounds
- **Special Cases:** 
  - Win 1 round + tie 1 round = match victory
  - 2 consecutive ties = draw game
  - Otherwise play tiebreaker round

### Round Victory
- **Victory Points (VP) System:** Player with most VP at round end wins
- **Default VP:** Each slot won = 1 VP
- **Winning the round:** Need 3 or more VP (majority of 4 slots)
- **Ties:** If both players have 2 VP, round is a tie
  - First tie: Game continues (each player has 0 wins, 1 tie)
  - Second tie: Game ends in a draw
  - Win + tie = Match victory (1 win + 1 tie is enough to win)
- **Additional VP:** Units and effects can generate bonus VP

---

## Game Setup

### Deck Construction Rules
- **Deck Size:** 25-30 cards (recommended: start with 25)
- **Copy Limit:** Max 3 copies of any single card
- **Card Types:** Mix of Unit cards and Action cards

### Round Start
1. **First Round:** Each player draws 8 cards
2. **Subsequent Rounds:** Each player draws 4 cards
3. **Mulligan Phase:** Not implemented in MVP (future feature)

---

## Gameplay

### The Battlefield
- **4 Slots** arranged in a line, facing each other:

```
[1][2][3][4] - Player 1
[1][2][3][4] - Player 2
```

- Each slot can hold **one unit per player**
- Slots are numbered 1-4 for reference (adjacency matters for some effects)
- Players compete for control of each slot by comparing unit power
- **Ongoing Effects:** Slots can have persistent effects that trigger when units are deployed to them
  - Effects persist between rounds
  - Multiple effects can stack on the same slot
  - Effects are controlled by the player who created them

### Turn Structure

**Priority System:**
- First round: determined randomly at game start
- Priority alternates each time a card is played
- Playing a card passes priority to opponent

**Each Turn:**
1. Priority player either:
   - Plays 1 card (Unit to slot OR Action card), OR
   - Passes
2. If player plays a card, priority switches to opponent
3. If player passes, they are locked out (cannot play more cards this round)
4. Opponent can continue playing until they also pass
5. Round ends when **both players pass consecutively**

**Important Rules:**
- Once you pass, you cannot play cards for remainder of round
- Passing early saves cards but may cost VP opportunities

**Resolution Sequence (after both pass):**
1. Compare power at each slot
2. Award 1 VP to winner of each slot (ties award no VP)
3. Trigger Conquer effects from left to right (slot 0 → 1 → 2 → 3)
4. Determine round winner (most VP wins, tie if equal)
5. Award round win or record tie
6. All units discarded, ongoing effects persist
7. Start next round or end match

**IMPORTANT TIMING:**
- VP is only calculated AFTER both players pass
- During the round, VP shown is "projected" based on current board state
- Conquer effects cannot affect VP calculation (it already happened)
- Conquer effects happen left to right, only on winning units

### Playing Cards

**Unit Cards:**
- Play face-up to any slot
- If you already have a unit on that slot, the new unit **sacrifices** the old one
  - Old unit is removed (sacrifice effects trigger if any)
  - New unit takes its place
  - New unit's Deploy effects trigger
- One unit per slot per player maximum
- When a unit is deployed to a slot, all ongoing effects on that slot trigger (if controlled by the deploying player)

**Strategic Note:** Replacing units allows adaptation but costs resources - you lose the card you're replacing and its potential value.

**Action Cards:**
- Play from hand, resolve immediately, then discard
- Do not occupy slots
- Can target units already in play
- Can create ongoing effects on slots
- Can remove ongoing effects from slots

### Round Resolution

**When both players pass:**
1. Compare power at each slot (base unit power + any power modifications from effects)
2. Higher power wins that slot (tie = nobody wins)
3. Slot winner gains 1 VP
4. Resolve any "Conquer" effects (may grant additional VP or cards)
5. Player with most VP wins the round
6. Discard all units from slots
7. **Ongoing slot effects persist** to next round
8. Begin next round (or determine match winner)

---

## Effect Keywords & Glossary

### Power Modification

**Deal X damage**
- Removes X power from a unit permanently
- Power cannot go below 0
- *Example: "Deal 3 damage to an enemy"*

**Give +X power**
- Adds X power to a unit permanently (for this round)
- *Example: "Give an ally +3 power"*
- *Example: "Give all close allies +2 power"*

**Heal X**
- Restores X power previously lost to damage
- Cannot exceed original power value
- No effect if unit hasn't been damaged
- *Example: "Heal an ally by 3"*

### Positional Terms

**Close**
- Adjacent slots (directly left OR right)
- Slot 2's close slots = 1 and 3
- Slot 1's close slot = only 2 (edge case)
- Slot 4's close slot = only 3 (edge case)
- *Example: "Deal 1 damage to close enemies"*

**Far**
- Non-adjacent slots (NOT directly left or right)
- Slot 2's far slots = 4 only (1 is close)
- Slot 1's far slots = 3, 4
- *Example: "Deal 2 damage to a far enemy"*

**All**
- Every unit that exists in the specified category
- *Example: "Deal 1 damage to all enemies"*
- *Example: "Give all allies +1 power"*

### Slot Targeting

**a slot**
- Choose any slot
- Gives player flexibility to target your own or opponent's slot
- *Example: "Give a slot 'Deploy: Give this unit +2 power.'"*

**your slot**
- Choose one of your slots (beneficial effect for you)
- *Example: "Give your slot 'Deploy: Deal 2 damage to close enemies.'"*

**an opponent's slot**
- Choose one of opponent's slots (harmful effect for them)
- *Example: "Give an opponent's slot 'Deploy: This unit gets -1 power.'"*

**this slot**
- The slot where this unit is deployed (only for unit cards)
- *Example: "Deploy: Give this slot 'Deploy: Give this unit +1 power.'"*

**all slots / all your slots / all opponent's slots**
- Multiple slots affected
- *Example: "Give all your slots 'Deploy: Give this unit +1 power.'"*

### Timing Keywords

**Deploy**
- Triggers when a unit enters play
- Happens immediately upon being played
- *Example: "Deploy: Draw 1 card"*
- *Example: "Deploy: Deal 1 damage to close enemies"*

**Conquer**
- Triggers when a unit wins its slot
- Happens during resolution phase AFTER all slot winners are determined
- **Restriction:** Conquer effects CANNOT affect other units (only VP, cards, or self)
- All Conquer effects trigger simultaneously
- *Example: "Conquer: Gain 1 additional VP"*
- *Example: "Conquer: Draw 2 cards"*

**Sacrifice**
- Remove one of your units from play (goes to discard)
- Triggers "when sacrificed" effects on the unit
- Can happen via:
  1. Action cards with "Sacrifice" cost (e.g., "Sacrifice an ally: Deal damage")
  2. Unit abilities with sacrifice costs
  3. **Playing a new unit to a slot you already occupy** (replaces via sacrifice)
- *Example: "Sacrifice an ally: Deal damage equal to its power to close enemies"*

**Death**
- Triggers when a unit is removed from play for any reason
- Includes: Sacrifice, replacement, removal by action cards, damage reduction to 0
- More general than Sacrifice (catches all removal)
- *Example: "Death: Give this slot 'Deploy: Give this unit +1 power'"*
- *Note:* Units with both Death and Sacrifice triggers will trigger both when sacrificed

**Bounce**
- Return a unit to its owner's hand
- Bounced units can be replayed later
- Triggers Deploy effects again when replayed
- Does not trigger Death effects (unit didn't die, just returned to hand)
- *Example: "Deploy: Bounce a close unit. If an ally was bounced, discard a card"*

**Heal**
- Restore lost power to a unit
- Cannot exceed the unit's original power
- *Example: "Heal 2" on a unit with 3/5 power (3 current, 5 original) → becomes 5/5*
- *Example: "Heal 3" on a unit with 5/5 power (full health) → stays 5/5*

### Ongoing Slot Effects

**Format:** *Give [slot target] "[Trigger]: [Effect]"*

**How They Work:**
- Creates a persistent effect on a slot
- Effect survives round end and carries to next round
- Multiple effects can stack on the same slot
- Effects are controlled by the player who created them
- Only trigger for that player's units (beneficial) OR only for opponent's units (harmful)

**Effect Application:**
Slot effects grant abilities to the unit occupying that slot:

1. **Permanent Buffs (no trigger):** 
   - Applied continuously while unit occupies the slot
   - Example: "Give this slot +2 power" → Unit on this slot has +2 power
   - If unit leaves (bounced, replaced), it loses the buff

2. **Triggered Abilities (Deploy, etc.):**
   - Unit GAINS the ability when placed on the slot
   - Ability triggers immediately (for Deploy)
   - Example: "Give this slot 'Deploy: +2 power'" → Unit deployed here gets +2 power permanently
   - Unit KEEPS the buff even if it leaves the slot (buff was granted on deploy)

**Examples:**
- *Give your slot "Deploy: Give this unit +2 power."* 
  - Any unit you deploy here permanently gains +2 power
  
- *Give your slot "+2 power"* 
  - Unit on this slot has +2 power while on this slot
  - Unit loses buff if bounced/moved
  
- *Give an opponent's slot "Deploy: This unit gets -1 power."* 
  - Enemy units deployed here permanently lose 1 power
  
- *Give a slot "Deploy: Deal 2 damage to close enemies."* 
  - Unit deployed here triggers damage effect immediately

**Effect Ownership:**
- You control effects you create
- Your beneficial effects only help YOUR units when they deploy
- Your harmful effects only hurt OPPONENT'S units when they deploy
- Exception: Neutral effects (if designed) could help whoever deploys

**Effect Stacking:**
If Slot 3 has multiple effects:
1. "Deploy: Give this unit +2 power" (yours)
2. "Deploy: Deal 2 damage to close enemies" (yours)
3. "Deploy: This unit gets -1 power" (opponent's curse)

When YOU deploy to Slot 3:
- Your effects #1 and #2 trigger
- Opponent's effect #3 does NOT trigger (it's theirs, only affects them)

When OPPONENT deploys to Slot 3:
- Your effects #1 and #2 do NOT trigger (only help you)
- Opponent's effect #3 triggers (harms them)

**Effect Removal:**
- *"Remove an effect from a slot"* - Choose one specific effect to remove
- *"Remove all effects from a slot"* - Clear everything from one slot
- Can remove YOUR effects or OPPONENT'S effects
- All slot effects are public information

### Targeting Clarifications

**Singular = Choose One**
- "Deal 3 damage to an enemy" = choose one enemy unit
- "Give an ally +2 power" = choose one ally unit
- "Give a slot [effect]" = choose one slot

**Plural/All = Affects Multiple**
- "Deal 1 damage to all enemies" = hits every enemy unit
- "Give all allies +1 power" = affects every ally unit
- "Give all slots [effect]" = affects every slot

**Self-Targeting:**
- "Give all allies +2 power" includes the unit itself
- Use "other allies" to exclude self

---

## Card Design

### Unit Cards

**Structure:**
- **Name**
- **Power:** Number value (base power, contributes to slot control)
- **Ability:** Optional text (triggered or activated effects)

**Common Unit Ability Patterns:**
- *Deploy:* [Effect] - Triggers when played
- *Conquer:* [Effect] - Triggers when this wins its slot
- *Close/Far allies/enemies Conquer:* [Effect] - Triggers when nearby units win

### Action Cards

**Structure:**
- **Name**
- **Effect:** Immediate resolution

**Common Action Patterns:**
- Direct power modification: "Deal X damage" or "Give +X power"
- Card draw: "Draw X cards"
- VP generation: "Gain X VP if [condition]"
- Create ongoing effects: "Give [slot] '[Effect]'"
- Remove ongoing effects: "Remove [effects] from [slot]"
- Unit repositioning: "Move unit to adjacent slot"

---

## Victory Point (VP) System

### VP Sources

**Primary:**
- Each territory won = 1 VP

**Bonus VP (via card effects):**
- "If this wins its territory, gain 1 additional VP" (2 VP total from one territory)
- "If you control 3+ territories, gain 1 VP" (quest-style)
- "At round end, gain 1 VP" (unconditional)
- Action cards: "Gain 2 VP if [condition]"

**VP Denial:**
- "Opponent loses 1 VP" effects

### Strategic Implications

**Multiple Paths to Victory:**
1. **Slot Control:** Win 3+ slots (3+ VP minimum - majority)
2. **Efficient Units:** Win 2 slots with VP-generating units (could reach 3+ VP)
3. **Alternative VP:** Generate VP through effects while winning fewer slots
4. **Hybrid:** Combine slot wins with bonus VP

---

## Sample Cards

**Design Note:** With replacement-as-sacrifice, units with "when sacrificed" effects gain additional value by enabling smooth upgrades throughout the round.

### Units with Direct Effects

**Champion** - Unit (Power 5)
- *No ability*

**Scout** - Unit (Power 1)
- *Deploy: Draw 1 card*

**Shock Trooper** - Unit (Power 3)
- *Deploy: Deal 1 damage to close enemies*

**Field Medic** - Unit (Power 1)
- *Deploy: Heal an ally by 3*

**Sniper** - Unit (Power 2)
- *Deploy: Deal 3 damage to a far enemy*

**Elite Guard** - Unit (Power 4)
- *Conquer: Gain 1 additional VP*

**Tactician** - Unit (Power 2)
- *Conquer: Draw 2 cards*

**War Banner** - Unit (Power 1)
- *Close allies Conquer: Gain 1 VP*

**Opportunist** - Unit (Power 2)
- *This gets +1 power for each empty slot*

### Units that Create Ongoing Effects

**Engineer** - Unit (Power 2)
- *Deploy: Give this slot "Deploy: Give this unit +1 power."*

**Architect** - Unit (Power 1)
- *Deploy: Give a close slot "Deploy: Give this unit +1 power."*

**Warlord** - Unit (Power 3)
- *Conquer: Give this slot "Deploy: Deal 1 damage to close enemies."*

**Demolisher** - Unit (Power 3)
- *Deploy: Remove an effect from a slot*

**Master Builder** - Unit (Power 2)
- *Conquer: Give all close slots "Deploy: Give this unit +1 power."*

**Poisoned Well** - Unit (Power 2)
- *Deploy: Give an opponent's slot "Deploy: This unit gets -2 power."*

**Saboteur** - Unit (Power 1)
- *Deploy: Give an opponent's close slot "Deploy: Deal 1 damage to this unit."*

### Actions - Direct Effects

**Study the Field** - Action
- *Draw 2 cards*

**Rally Commander** - Action
- *Give all close allies +2 power*

**Plague Spreader** - Action
- *Deal 1 damage to all units*

**Assassinate** - Action
- *Deal 5 damage to an enemy*

**Reposition** - Action
- *Move an ally to a close slot*

### Actions - Ongoing Effects (Beneficial)

**Fortify** - Action
- *Give your slot "Deploy: Deal 2 damage to close enemies."*

**Entrench** - Action
- *Give your slot "Deploy: Give this unit +2 power."*

**Field Hospital** - Action
- *Give your slot "Deploy: Heal this unit by 3."*

**Watchtower** - Action
- *Give your slot "Deploy: Draw 1 card."*

**Armory** - Action
- *Give your slot "Deploy: Give a close ally +2 power."*

**Fortified Line** - Action
- *Give all your slots "Deploy: Give this unit +1 power."*

### Actions - Ongoing Effects (Harmful/Curses)

**Curse** - Action
- *Give an opponent's slot "Deploy: This unit gets -1 power."*

**Trap** - Action
- *Give an opponent's slot "Deploy: Deal 2 damage to this unit."*

**Plague Grounds** - Action
- *Give an opponent's slot "Deploy: Deal 1 damage to close allies."*

**Minefield** - Action
- *Give all opponent's slots "Deploy: This unit gets -1 power."*

### Actions - Effect Removal

**Scorched Earth** - Action
- *Remove all effects from a slot*

**Cleanse** - Action
- *Remove all effects from all slots*

**Dispel** - Action
- *Remove an effect from a slot*

### Actions - Flexible Targeting

**Ancient Shrine** - Action
- *Give a slot "Deploy: Draw 1 card."*
- (Can place on your slot OR opponent's slot - whoever deploys there draws)

**Power Node** - Action
- *Give a slot "Deploy: Give this unit +3 power."*
- (Strategic placement - if you win slot, you benefit; if opponent wins, they benefit)

### Actions - Sacrifice Effects

**Bloodrite** - Action
- *Sacrifice an ally to distribute damage equal to its power to close enemies.*

**Dark Bargain** - Action
- *Sacrifice an ally: Draw cards equal to its power.*

**Ritual of Power** - Action
- *Sacrifice an ally: Give all your allies +2 power.*

**Soul Transfer** - Action
- *Sacrifice an ally: Give an ally +power equal to the sacrificed unit's power.*

**Final Stand** - Action
- *Sacrifice an ally: Gain VP equal to its power.*

**Desperate Gambit** - Action
- *Sacrifice all allies in close slots: Deal 5 damage to all enemies.*

### Units with Sacrifice Abilities

**Cultist** - Unit (Power 1)
- *Deploy: You may sacrifice an ally to deal 3 damage to an enemy.*

**Ritualist** - Unit (Power 2)
- *Deploy: Sacrifice an ally: Give this slot "Deploy: Give this unit +3 power."*

**Martyr** - Unit (Power 2)
- *Death: Give close allies +2 power*
- (Buffs adjacent units when it dies)

**Offering Bearer** - Unit (Power 1)
- *Sacrifice this: Gain 2 VP.*

**Blood Mage** - Unit (Power 3)
- *Conquer: You may sacrifice an ally to deal 4 damage to an enemy.*

### Units with Sacrifice Synergy (Replacement Combos)

**Pawn** - Unit (Power 1)
- *Death: Give an ally +2 power*
- (Play early, dies for value when replaced or removed)

**Recycler** - Unit (Power 2)
- *Death: Return a card from your discard to your hand*

**Fuel for the Fire** - Unit (Power 1)
- *Deploy: Draw 1 card*
- (Pure value from Deploy, can be replaced for upgrade)

**Expendable** - Unit (Power 1)
- *When this is sacrificed, reduce the cost of your next unit by its power*
- (Note: If we add costs later, this is relevant)

**Seedling** - Unit (Power 1)
- *Death: Give this slot "Deploy: Give this unit +1 power"*
- (Replacement builds up the slot for next unit!)

**Bouncer** - Unit (Power 2)
- *Deploy: Bounce a close unit. If an ally was bounced this way, discard a card*
- (Free disruption on enemies, resource cost for ally combos)

---

## Open Design Questions

1. **Final deck size:** 25 or 30 cards?
   - 25 = More consistency
   - 30 = More variety

2. **Deckbuilding constraints:**
   - Currently just deck size and copy limits
   - Will we need additional constraints after testing?
   - Power budget? Faction restrictions? Other limits?

3. **VP caps:**
   - Should there be a maximum VP per round?
   - Currently: no cap

4. **Ongoing effect limits:**
   - Maximum effects per slot? (Unlimited vs cap at 5-7)
   - Can negative effects reduce power below 0? (Currently: stops at 0)

5. **Card draw limits:**
   - Maximum hand size?
   - Currently: no limit

6. **Neutral ongoing effects:**
   - Should some effects help whoever deploys (like "Deploy: Draw 1 card")?
   - Or should all effects be player-owned?

7. **Effect removal granularity:**
   - Remove one at a time (current)
   - Or need "remove all beneficial" vs "remove all harmful" options?

8. **Curse counterplay:**
   - Are cursed slots too easy to avoid?
   - Should curses have additional punishment for avoiding the slot?

9. **Sacrifice timing:**
   - Can you sacrifice at any time, or only when playing actions/abilities that say "sacrifice"?
   - Currently: Only via card effects

---

## Next Steps for Development

1. **Design initial card pool** (30-50 cards)
   - Variety of power levels (1-5)
   - Mix of Deploy, Conquer, and passive abilities
   - Ongoing effects (beneficial and harmful)
   - Sacrifice cards
   - Removal and utility
2. **Create starter decks** (2-3 pre-built decks with different strategies)
   - Aggro deck (minimal ongoing)
   - Investment/Engine deck (heavy ongoing)
   - Control deck (removal-focused)
3. **Playtest core loop**
   - Is passing dynamic interesting?
   - Do ongoing effects create fun buildup or just snowball?
   - What power levels feel balanced?
   - What effects are too strong/weak?
4. **Identify balance issues**
   - Which cards dominate?
   - Which strategies are non-viable?
   - What deckbuilding constraints (if any) are needed?
5. **Test ongoing effect gameplay**
   - Is removal accessible enough?
   - Are curses effective?
   - Does stacking feel good or overwhelming?
6. **Test sacrifice mechanic**
   - Is it satisfying to use?
   - Does it enable interesting combos?
   - Is it too weak/strong?
7. **Iterate and refine**
   - Adjust card power levels based on play
   - Add/remove mechanics as needed
   - Only add constraints (power budget, etc.) if problems emerge

---

## Quick Reference Glossary

- **VP (Victory Points):** Points earned during a round; most VP wins round
- **Slot:** One of five positions where units are played (replaces "territory")
- **Priority:** Who plays first this turn
- **Pass:** Decline to play a card; locks you out for rest of round
- **Mulligan:** Exchange up to 2 cards at round start
- **Close:** Adjacent slots (directly left or right)
- **Far:** Non-adjacent slots
- **Deploy:** When a unit enters play
- **Conquer:** When a unit wins its slot
- **Sacrifice:** Remove one of your units from play as a cost for an effect
- **Death:** Triggers when a unit is removed from play for any reason (sacrifice, replacement, removal, etc.)
- **Bounce:** Return a unit to its owner's hand (can be replayed later)
- **Heal:** Restore lost power to a unit (cannot exceed original power)
- **Ongoing Effect:** Persistent effect on a slot that survives between rounds
- **Deal X damage:** Remove X power from unit (stops at 0)
- **Give +X power:** Add X power to unit (permanent for the round)
- **Heal X:** Restore X power lost to damage (can't exceed original)

---

*Document Version: 2.2*
*Last Updated: 2024*
*Major Changes: Removed power budget system to focus on card design and playtesting first; constraints will be added only if needed after testing*

---

## Quick Mockup and Testing

### Recommended Development Approach

**Goal:** Get a playable prototype as fast as possible to test core mechanics and balance.

### Technology Stack: React Web App

**Why React:**
- ✅ Fastest development for card games (4-8 hours to playable)
- ✅ No learning curve if familiar with web development
- ✅ Instant hot-reload iteration
- ✅ Easy to share with remote testers (just send URL)
- ✅ Simple UI with divs/CSS - no fancy graphics needed
- ✅ Perfect for turn-based card game logic

**Alternatives considered:**
- Unity: 15-25 hours (overkill for card game, requires C# learning)
- Phaser.js: 10-15 hours (better for real-time games)
- Paper prototype: 2 hours (good for initial feel, but slow iteration)

### Development Timeline

**Phase 1: Core Game (4-6 hours)**
1. Static layout (30 min)
   - Two rows of 5 slots facing each other
   - Hand of cards at bottom
   - VP counter, round counter
   
2. Card data structure (1 hour)
   - JSON card definitions
   - 10-15 simple cards to start
   
3. Core mechanics (2-3 hours)
   - Play card to slot
   - Pass button
   - Resolve slots (compare power, award VP)
   - Round progression (draw 3 cards, reset board)
   
4. Basic effects (1-2 hours)
   - Deploy triggers
   - Simple ongoing effects
   - Basic actions (damage, buff)

**What to skip in v1:**
- ❌ Pretty graphics (colored divs are fine)
- ❌ Animations (instant state changes)
- ❌ All card abilities (start with 10-15 simple cards)
- ❌ Complex effects (add sacrifice, curses after core works)
- ❌ Mulligan (add in v2)

**Phase 2: AI Opponent (2-4 hours)**

See AI Opponent section below.

**Phase 3: Network Play (3-4 hours)**

For remote playtesting with others.

### AI Opponent Options

**Problem:** Playing against random moves won't reveal balance issues. Need strategic AI.

#### Option 1: Claude API (Recommended)

**Why this is best for prototyping:**
- ✅ Fastest to implement (30 minutes)
- ✅ Claude already understands your game rules (we designed it together!)
- ✅ Makes strategic decisions, not just heuristics
- ✅ Can explain reasoning (helps identify balance issues)
- ✅ Adjustable difficulty ("play optimally" vs "play like beginner")
- ✅ Very cheap: ~$0.003-0.006 per AI turn (less than a penny)

**Cost Reality:**
- Get $5 free credits when signing up at console.anthropic.com
- $5 = 200-500 games worth of testing
- Each game: ~$0.01-0.05
- 100 test games: ~$0.30-0.60 total

**Important:** Claude API is separate from Claude Pro subscription
- Claude Pro: Chat interface access ($20/month)
- Claude API: Pay-per-use for code integration (separate budget)
- Need to create API key at console.anthropic.com

**Implementation:**
```javascript
async function getAIMove(gameState, aiHand) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are playing a strategic card game.

GAME STATE:
Round: ${gameState.round}/3
Your VP: ${gameState.aiVP} | Opponent VP: ${gameState.playerVP}
Your hand: ${JSON.stringify(aiHand)}

BOARD (5 slots):
${gameState.slots.map((slot, i) => `
  Slot ${i+1}:
    Player unit: ${slot.playerUnit?.name} (Power ${slot.playerUnit?.power})
    Your unit: ${slot.aiUnit?.name} (Power ${slot.aiUnit?.power})
    Ongoing effects: ${slot.effects.join(', ')}
`).join('\n')}

RULES REMINDER:
- Win round by getting most VP (each slot won = 1 VP)
- Can pass to save cards for future rounds
- Ongoing effects persist between rounds
- Consider whether to invest in ongoing effects or win now

Choose your move. Respond with ONLY valid JSON:
{
  "action": "play" | "pass",
  "cardIndex": number (index in your hand if playing),
  "slotIndex": number (0-4 if playing unit),
  "reasoning": "brief explanation of strategy"
}`
      }]
    })
  });
  
  const data = await response.json();
  const move = JSON.parse(data.content[0].text);
  return move;
}
```

**Advantages for testing:**
- AI understands sacrifice value, ongoing effect investment
- Makes round-to-round strategic decisions (invest now or win later)
- Can test against different playstyles: "play aggressively to win fast" vs "build ongoing effects"
- Explains moves so you understand what it's thinking

#### Option 2: Ollama (Local LLM)

**When to use:**
- Want zero ongoing cost
- Don't mind 1-2 hour setup
- Want offline testing
- Have Apple Silicon Mac (runs great on M1/M2/M3)

**Setup:**
```bash
brew install ollama
ollama pull llama3.1:8b  # Fast, decent reasoning
# or
ollama pull qwen2.5:14b  # Slower, better reasoning
```

**Implementation:**
```javascript
async function getAIMove(gameState, aiHand) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.1:8b',
      prompt: `[Same prompt as Claude API]`,
      stream: false,
      format: 'json'
    })
  });
  
  const data = await response.json();
  return JSON.parse(data.response);
}
```

**Performance:**
- llama3.1:8b: 2-5 seconds per move
- qwen2.5:14b: 5-10 seconds per move
- Quality: Good strategic play, not quite as strong as Claude

#### Option 3: Hybrid Approach (Best of Both)

```javascript
const AI_PROVIDER = process.env.REACT_APP_AI_PROVIDER || 'claude';

async function getAIMove(gameState, aiHand) {
  if (AI_PROVIDER === 'claude') {
    return await callClaudeAPI(gameState, aiHand);
  } else if (AI_PROVIDER === 'ollama') {
    return await callOllama(gameState, aiHand);
  }
}
```

**Strategy:**
1. Start with Claude API (use $5 free credits)
2. Get 200-500 test games to validate mechanics
3. If you need more testing: set up Ollama as free backup
4. Toggle between them based on need

#### Comparison Table

| Feature | Claude API | Ollama (Local) | Heuristics |
|---------|-----------|----------------|------------|
| Setup time | 30 min | 1-2 hours | 2-3 hours |
| Cost per game | $0.01 | Free | Free |
| Move speed | 1-3 sec | 5-15 sec | Instant |
| Strategic reasoning | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Understands your game | Yes (we designed it!) | With good prompt | Only coded rules |
| Offline capable | ❌ | ✅ | ✅ |
| Explains decisions | ✅ | ✅ | ❌ |
| Free tier | $5 credits | Unlimited | N/A |

**Recommendation:** Start with Claude API, add Ollama later if needed.

### Network Play (For Remote Testing)

**When needed:** Playing with friends/testers in other locations (e.g., brother in another country)

#### Recommended: Firebase Realtime Database

**Why Firebase:**
- ✅ No backend server to manage
- ✅ Free tier is generous
- ✅ 2-3 hour setup
- ✅ Persistent (survives disconnects)
- ✅ Built-in authentication

**Basic setup:**
```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// Player 1 creates game
const gameId = generateGameCode();
const gameRef = ref(db, `games/${gameId}`);
set(gameRef, initialGameState);

// Player 2 joins with code
// Both listen to same game state
onValue(gameRef, (snapshot) => {
  setGameState(snapshot.val());
});

// When player makes move
set(ref(db, `games/${gameId}/state`), newGameState);
```

**Alternative: Socket.io**
- More setup (need to run server)
- True real-time
- 3-4 hours to implement

### Recommended Build Order

**Weekend 1: Core + AI (6-10 hours)**
1. Basic React UI and game logic (4-6 hours)
2. Claude API integration (30 min)
3. 10-15 simple test cards (1 hour)
4. First playtests against AI (2-3 hours)

**Weekend 2: Refinement + Network (6-8 hours)**
1. Fix issues found in AI testing (2-3 hours)
2. Add Firebase for network play (2-3 hours)
3. Add more cards and mechanics (2 hours)
4. Remote playtest with human players (2-3 hours)

**Result:** Fully functional prototype in 12-18 hours total

### Key Testing Questions

Use AI and network testing to answer:
1. Is the core loop (play cards, pass, resolve) fun?
2. Do ongoing effects create interesting decisions or just snowball?
3. Is sacrifice mechanic satisfying?
4. What power levels feel balanced?
5. Are rounds too long/short?
6. Is passing dynamic interesting?
7. Which strategies emerge as dominant?
8. What cards are never played? (candidates for removal/redesign)

---

## Future Vision (Post-Core Testing)

### Faction Identity & Leader System

**Note:** These features should only be implemented AFTER extensive playtesting of the core game (10-20+ sessions) to ensure the foundational mechanics are balanced and fun.

### Faction System Concept

**Goal:** Add deckbuilding variety and strategic identity while maintaining core gameplay

**Potential Factions** (based on emerging archetypes):
1. **Militaristic/Aggro Faction**
   - High power units, direct damage
   - Focus: Winning slots through raw power
   
2. **Arcane/Investment Faction**
   - Ongoing effects, slot manipulation
   - Focus: Building long-term advantages
   
3. **Cultist/Sacrifice Faction**
   - Sacrifice synergies, fodder units
   - Focus: Converting resources into burst value
   
4. **Defensive/Control Faction**
   - Healing, curses, removal
   - Focus: Disrupting opponent and denying strategies
   
5. **Tactical/Flexible Faction**
   - Unit repositioning, card draw
   - Focus: Adaptability and information advantage

### Leader/Champion/Hero System Concept

**Structure:**
- Each player chooses a Leader at game start
- Leader determines 1-2 faction restrictions for deckbuilding
- Leader provides unique ability (passive, active, or both)
- Leader is NOT a card in deck - separate game piece

**Deckbuilding Restriction Examples:**
- "60-80% of deck must be from this faction"
- "At least 15 cards from primary faction"
- "Can include cards from 2 factions maximum"

**Leader Ability Examples:**

*Passive Abilities (always active):*
- "Your units get +1 power in slots 1 and 5"
- "Ongoing effects on your slots cannot be removed"
- "When you sacrifice a unit, draw a card"
- "Close allies get +1 power"

*Activated Abilities (cost required):*
- "Once per round: Give a slot 'Deploy: Give this unit +1 power'"
- "Discard a card: Move a unit to a close slot"
- "Sacrifice a unit: Deal 3 damage to an enemy"
- "Once per round: Remove an effect from a slot"

*Mixed (passive + active):*
- Passive: "Your sacrifice effects deal +1 damage"
- Active: "Once per round, sacrifice a unit: Gain 1 VP"

**Starting Bonus Examples:**
- "Start Round 1 with a +1 power ongoing effect on slot 3"
- "Draw 1 additional card at game start (9 instead of 8)"
- "Start with 1 additional VP in Round 1"

### Implementation Priorities

**Before adding factions:**
1. ✅ Core gameplay must be fun and balanced
2. ✅ 3-5 distinct viable strategies identified through playtesting
3. ✅ Card pool large enough (60-100+ unique cards)
4. ✅ Players asking for more variety/customization
5. ✅ Power budget and VP systems stable

**Design Process:**
1. Playtest core game extensively (10-20+ sessions)
2. Identify natural archetypes that emerge
3. Design 3-4 factions around successful archetypes
4. Create 2-3 leaders per faction with thematic abilities
5. Test faction-restricted deckbuilding
6. Balance leader abilities against each other
7. Expand card pool with faction-specific cards

**Questions to Answer First:**
- How many factions is ideal? (3-5?)
- How strict should faction restrictions be?
- Should leaders be interchangeable with factions, or locked?
- Do leaders need counters/resources to track activations?
- Should there be neutral cards available to all factions?

---

*This vision represents potential future expansion, not current design priorities.*