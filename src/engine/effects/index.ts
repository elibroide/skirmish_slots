// Export all effects for easy importing
export { Effect } from './Effect';
// Core atomic effects have been moved to Player/UnitCard methods
// export { DrawCardEffect } from './DrawCardEffect';
// export { DeployUnitEffect } from './DeployUnitEffect';
// export { ConsumeUnitEffect } from './ConsumeUnitEffect';
// export { DeathEffect } from './DeathEffect';
// export { BounceUnitEffect } from './BounceUnitEffect';
// export { PlayCardEffect } from './PlayCardEffect';
// export { PassEffect } from './PassEffect';
// export { DiscardCardEffect } from './DiscardCardEffect';

// Complex game phase effects remain
export { StartSkirmishEffect } from './StartSkirmishEffect';
export { ResolveSkirmishEffect } from './ResolveSkirmishEffect';
export { TurnStartEffect } from './TurnStartEffect';
export { TurnEndEffect } from './TurnEndEffect';
export { ResolveDeathsEffect } from './ResolveDeathsEffect';
