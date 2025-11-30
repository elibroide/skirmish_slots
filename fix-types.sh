#!/bin/bash

# Fix DeathEffect.ts
sed -i '' 's/const events = \[\]/const events: GameEvent[] = []/' src/engine/effects/DeathEffect.ts
sed -i '' 's/import { Effect } from/import type { GameEvent } from "..\/.types";\nimport { Effect } from/' src/engine/effects/DeathEffect.ts

# Fix SacrificeUnitEffect.ts
sed -i '' 's/const events = \[\]/const events: GameEvent[] = []/' src/engine/effects/SacrificeUnitEffect.ts
sed -i '' 's/import { Effect } from/import type { GameEvent } from "..\/.types";\nimport { Effect } from/' src/engine/effects/SacrificeUnitEffect.ts

# Fix ResolveRoundEffect vp issue
sed -i '' 's/vp: \[vp0, vp1\]/vp: [vp0, vp1] as [number, number]/' src/engine/effects/ResolveRoundEffect.ts

# Fix unused imports
sed -i '' '/import { shuffle } from/d' src/engine/index.ts
