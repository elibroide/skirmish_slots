// Singleton reference to the active game engine
// This avoids storing the mutable engine in Zustand/Immer stores where it gets frozen.
let activeEngine = null;
export const setGlobalEngine = (engine) => {
    activeEngine = engine;
};
export const getGlobalEngine = () => {
    return activeEngine;
};
