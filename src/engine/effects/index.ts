// Export all effects for easy importing
export { Effect } from './Effect';

// Action effects - wrap all player actions for consistent effect stack ordering
export { PlayCardEffect } from './PlayCardEffect';
export { ActivateEffect } from './ActivateEffect';
export { PassEffect } from './PassEffect';
export { ActivateLeaderEffect } from './ActivateLeaderEffect';

// Complex game phase effects
export { StartSkirmishEffect } from './StartSkirmishEffect';
export { ResolveSkirmishEffect } from './ResolveSkirmishEffect';
export { TurnStartEffect } from './TurnStartEffect';
export { TurnEndEffect } from './TurnEndEffect';
export { ResolveDeathsEffect } from './ResolveDeathsEffect';
