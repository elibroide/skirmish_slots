// Utility helper functions
let idCounter = 0;
/**
 * Generate a unique ID for cards, effects, etc.
 */
export function generateId() {
    return `id_${Date.now()}_${idCounter++}`;
}
/**
 * Shuffle an array in place using Fisher-Yates algorithm
 */
export function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
/**
 * Create a deep clone of an object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
