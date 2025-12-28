// Core
export { GameEngine } from './core/GameEngine';
// GameState helper functions
export { createInitialGameState, getOpponent, getAdjacentTerrains, getUnitInFront } from './core/GameState';
// GameState type
export type { GameState } from './core/types';
export { EventEmitter } from './core/EventEmitter';
export { GameLogger } from './core/logger/GameLogger';
export * from './core/types';
export * from './core/constants';

// Entities
export { Slot } from './entities/Slot';
export { Terrain } from './entities/Terrain';
export { Player } from './entities/Player';

// Systems
export { EffectStack } from './systems/EffectStack';
export { StateChecker } from './systems/StateChecker';
export { RuleType } from './systems/rules/RuleTypes';

// Mechanics
export * from './mechanics/cards';
export * from './mechanics/effects';
export * from './mechanics/leaders';

// AI & Controllers
export * from './controllers';
export * from './ai';

// Utils
export * from './utils/deckBuilder';

// API
export * from './api/createGame';
export * from './api/initializeGame';
export * from './api/engineInstance';
