📋 How to Create Your Trello TicketsFollow this schema to map your Taxonomy to Trello features.1. The Card Title FormatUse the "Big Rock" prefix to keep your board sortable and readable.Format: [ID] Area - Task NameExample: 1.1 Rules - Manual Pass & Done Logic2. The Label SystemCreate these labels in Trello before you start. This allows you to filter by "Initiative" (M2) or "Theme" (Tier).Label TextColorPurposeM2🟣 PurpleInitiative: Filters the board to show only Milestone 2 work.Tier 0: Design⚫ BlackTheme: Critical blockers/documentation updates.Tier 1: Mechanics🔴 RedTheme: Core engine & backend logic (High Priority).Tier 2: UI🟠 OrangeTheme: Frontend & React components.Tier 3: Content🟡 YellowTheme: JSON data, scripts, and card configs.Tier 4: Visuals🔵 BlueTheme: Art assets and Animation polish.[Backend](No Color)Tag: Filters for logic/infra work.[Frontend](No Color)Tag: Filters for UI work.[Content](No Color)Tag: Filters for data entry.3. Card Description TemplateCopy-paste this into every card to keep context clear for you (and your AI).Markdown**Context:**
[One sentence on why this is needed for M2]

**Acceptance Criteria:**
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

**Dependencies:**
[List any ticket IDs that must be done first]

⬜ Tier 0: Design Alignment (The Blocker)
Must be done first to align the "Source of Truth" for AI prompts.

0.1 📄 Update Design Docs to M2 Standards
[Design] M2 Tier 0: Design Goal: Consolidate all M2 mechanical changes into the core markdown files so future coding prompts are accurate. Checklist:

[ ] Turn Structure: Update CoreRules.md to remove "Auto-Pass" and define "Manual Pass" vs "Done" logic.

[ ] Deploy Rules: Update Gameplay.md to restrict deploying on occupied slots (remove "Replace", add "Consume" exception).

[ ] Leader System: Add Leader setup, Charges, and Quick Action definitions to GameDesign.md.

[ ] Keywords: Define Shield (math), Dominant (trigger), and Move in CardMechanics.md.

[ ] Conquer Rework: Update Conquer definition to "Win Lane = +1 SP" (remove old effect triggers).

[ ] Rarity: Add Bronze/Silver/Gold limits to CoreRules.md.

🟥 Tier 1: Core Mechanics (Engine & Rules)
Focus: Updating the state machine to support M2 rules.

1.0 Design - Align Documentation
[Design] M2 Tier 1: Core Mechanics Description: Ensure GameDesign.md fully reflects M2 mechanics before implementation.
[ ] Update GameDesign.md with Leader System (Charges, Separate Card).
[ ] Update GameDesign.md with Shield Mechanic details.
[ ] Update GameDesign.md with Dominant Keyword.
[ ] Update GameDesign.md with new Conquer (SP Bonus) rules.

1.1 Rules - Manual Pass & Done Logic
[Backend] M2 Tier 1: Core Mechanics Description: Implement the new turn structure distinguishing between "Passing" (temporary) and "Done" (locked out).

[ ] Refactor TurnState to support HasPassed vs IsDone.

[ ] Logic: If Action/Ability used -> State = Active (Can Pass).

[ ] Logic: If No Action used -> Player must click "Done".

[ ] Logic: Skirmish ends only when P1.IsDone && P2.IsDone.

[ ] Update turn timer/priority passing logic.

1.2 Mechanics - Leader System (Backend)
[Backend] [Infra] M2 Tier 1: Core Mechanics Description: Create the data structures for Leaders separate from the Deck.

[ ] Define Leader interface (Name, MaxCharges, AbilityID).

[ ] Add LeaderState to GameState (CurrentCharges, IsExhausted).

[ ] Implement "Quick Action" logic (Leader abilities do not pass priority automatically).

[ ] Implement Charge consumption and reset logic (Decide: Per Match or Per Skirmish? Start with Match).

1.3 Mechanics - Shield System
[Backend] M2 Tier 1: Core Mechanics Description: Implement damage reduction logic.

[ ] Add Shield property to Unit State.

[ ] Update DealDamage function:

If Shield > Damage -> Shield -= Damage.

If Damage > Shield -> Overflow = Damage - Shield, Shield = 0, Health -= Overflow.

1.4 Mechanics - Dominant & Conquer (Rework)
[Backend] M2 Tier 1: Core Mechanics Description: Implement the logic for lane dominance and the new Conquer SP scoring.

[ ] Dominant: Add listener/check on board state change. If Unit Power > Enemy Power -> Set IsDominant = true.

[ ] Conquer: Update Skirmish Resolution.

Old: Card effect trigger.

New: If Winner has Conquer keyword -> SP += 1 (Total 2 SP for that lane).

1.5 Mechanics - Move & Consume Support
[Backend] M2 Tier 1: Core Mechanics Description: Support for complex unit interactions.

[ ] Deploy Restrictions: Enforce "Deploy only to empty slot" (unless Consume keyword present).

[ ] Consume: Logic to target own unit, remove to graveyard, trigger OnConsume effects, deploy new unit.

[ ] Move: Logic to change SlotIndex of an existing unit without triggering OnDeploy (unless specified).

🟧 Tier 2: UI Implementation (The Interface)
Focus: Connecting the new backend state to React components.

2.1 UI - Leader Interface
[Frontend] M2 Tier 2: UI Implementation Description: Visual representation of the Leader.

[ ] Create LeaderPortrait component (Top corners).

[ ] Create LeaderButton with Charge indicators (e.g., 3 lightning bolts).

[ ] Handle click events -> Trigger API call.

[ ] visual states: Active (Glow), Cooldown (Gray), No Charges (Red).

2.2 UI - Board & Lane State
[Frontend] M2 Tier 2: UI Implementation Description: Better visualization of who is winning.

[ ] Split Board Background (Visual split P1/P2).

[ ] Add Slot Labels (T0-T4).

[ ] Lead Indicator: Add visual (Crown/Glow) to the unit winning the lane (Dominant feedback).

[ ] Shield Bar: Render Shield value distinct from Health/Power on the card frame.

2.3 UI - Two-Frame Card System
[Frontend] [Design] M2 Tier 2: UI Implementation Description: Refactor Card rendering to support two modes.

[ ] Create CardFull component (Hand/Tooltip): Full text, large art, detailed stats.

[ ] Create CardBoard component (Battlefield): Compact, Big Numbers, Icons only (No text).

[ ] Implement smooth transition/substitution between components on drag-drop.

2.4 UI - Pass/Done Button & Scoreboard
[Frontend] M2 Tier 2: UI Implementation Description:

[ ] Create dynamic Button:

State A: "Pass" (Yellow) - When action taken.

State B: "Done" (Green/Red) - When no action taken.

[ ] Implement Tennis-Style Scoreboard (History of S1, S2, S3 results).

🟨 Tier 3: Content (Data & Scripting)
Focus: Populating the game. Do this after mechanics work so you can test immediately.

3.1 Content - Database Update
[Content] M2 Tier 3: Content Description: Update the JSON/Structure of cards to match M2 fields.

[ ] Add fields: Shield, Rarity (Bronze/Silver/Gold), Archetype.

[ ] Update existing cards (e.g., update Noble to new Conquer mechanics).

[ ] Create spreadsheet for tracking balance/implementation status.

3.2 Content - Implement Leaders (x3)
[Content] [Backend] M2 Tier 3: Content Description: Script the first 3 leaders for testing.

[ ] Aggro Leader: Active: Deal 2 dmg (1 Charge).

[ ] Control Leader: Active: Move unit (1 Charge).

[ ] Passive Leader: Units with Shield get +1 Power.

3.3 Content - Implement Unit Batch A (Core)
[Content] [Backend] M2 Tier 3: Content Description: Ensure the 23 cards from CardCatalog.md are fully functional with new M2 mechanics.

[ ] Fix Noble (Conquer SP).

[ ] Verify Turret (Interaction with Shields).

[ ] Verify Dragon (New Consume logic).

3.4 Content - Implement Unit Batch B (New Mechanics)
[Content] [Backend] M2 Tier 3: Content Description: Create ~10 new cards specifically to test M2 features.

[ ] Create 3 Shield-focused units.

[ ] Create 3 Dominant-focused units.

[ ] Create 2 Conquer units (Bronze/Silver).

[ ] Create 2 Move/Positioning units.

3.5 Content - Deck Builder Logic
[Backend] [Frontend] M2 Tier 3: Content Description: Update deck builder to enforce M2 constraints.

[ ] Max 2 copies per card.

[ ] Rarity limits (if deciding to enforce strictly in M2, otherwise visual only).

[ ] Select Leader step.

🟦 Tier 4: Visuals & Juice (Art & Anim)
Focus: The "Hard Part" for you. Leave this for last so the game is playable while you struggle with this.

4.1 Infra - Animation System Setup
[Infra] [Frontend] M2 Tier 4: Visuals Description: Set up the library to handle event queues.

[ ] Install Framer Motion.

[ ] Create AnimationQueue context/service.

[ ] Concept: Queue backend events -> Play Frontend Animation -> Resolve -> Next Event.

4.2 Design - Art Style Guide & AI Prompts
[Design] M2 Tier 4: Visuals Description: Since you are using AI, spend time tuning the prompts once to get a consistent style.

[ ] Tune Midjourney/DALL-E prompt for "Cel-shaded fantasy card art".

[ ] Generate test assets for 3 core units (e.g., Knight, Dragon, Archer).

[ ] Define border colors/assets for Bronze/Silver/Gold.

4.3 Design - Card Asset Generation (Batch 1)
[Design] [Content] M2 Tier 4: Visuals Description: Generate art for the top 20 most used cards.

[ ] Generate Images.

[ ] Upscale and Crop.

[ ] Import into game assets.

4.4 Anim - Essential Feedback
[Frontend] M2 Tier 4: Visuals Description: Implement the "Phase 1A" animations from M2 doc.

[ ] Damage: Shake card + Float red number.

[ ] Death: Fade out/Disintegrate.

[ ] Deploy: Slide from hand to board.

[ ] Shield: Crack/Shatter effect (simple CSS change is fine for MVP).

4.5 Anim - Keyword Icons
[Design] [Frontend] M2 Tier 4: Visuals Description: Create or find SVGs for keywords to use on the CardBoard frame.

[ ] Icons needed: Shield, Dominant (Crown), Death (Skull), Conquer (Flag), Consume (Mouth).

[ ] Implement Tooltips on hover of these icons.