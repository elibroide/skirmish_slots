import { GameEngine } from '../core/GameEngine';

// Singleton reference to the active game engine
// This avoids storing the mutable engine in Zustand/Immer stores where it gets frozen.
let activeEngine: GameEngine | null = null;

export const setGlobalEngine = (engine: GameEngine) => {
    activeEngine = engine;
};

export const getGlobalEngine = (): GameEngine | null => {
    return activeEngine;
};
