import { Sage, Warlord } from './abilities';
/**
 * Leader Definitions - static data for all available leaders
 */
const LEADER_DEFINITIONS = {
    rookie: {
        leaderId: 'rookie',
        name: 'Rookie',
        maxCharges: 0,
        abilityDescription: 'No ability',
    },
    sage: {
        leaderId: 'sage',
        name: 'Sage',
        maxCharges: 1,
        abilityDescription: 'Draw 1 card',
    },
    warlord: {
        leaderId: 'warlord',
        name: 'Warlord',
        maxCharges: 2,
        abilityDescription: 'Deal 1 damage to an enemy unit',
    },
};
/**
 * Leader class constructors - used to instantiate leaders with engine/owner
 */
const LEADER_CLASSES = {
    sage: Sage,
    warlord: Warlord,
};
/**
 * Get a leader instance by ID
 * Returns definition and instantiated Leader (if any)
 */
export function getLeader(leaderId, engine, owner) {
    const definition = LEADER_DEFINITIONS[leaderId];
    if (!definition) {
        throw new Error(`Unknown leader: ${leaderId}`);
    }
    const LeaderClass = LEADER_CLASSES[leaderId];
    const ability = LeaderClass ? new LeaderClass(engine, owner, definition) : null;
    return { definition, ability };
}
/**
 * Get a leader definition by ID
 */
export function getLeaderDefinition(leaderId) {
    const definition = LEADER_DEFINITIONS[leaderId];
    if (!definition) {
        throw new Error(`Unknown leader: ${leaderId}`);
    }
    return definition;
}
/**
 * Get all available leader IDs
 */
export function getAllLeaderIds() {
    return Object.keys(LEADER_DEFINITIONS);
}
/**
 * Create initial leader state for a player
 */
export function createLeaderState(leaderId) {
    const id = leaderId || 'rookie';
    const definition = getLeaderDefinition(id);
    return {
        leaderId: id,
        currentCharges: definition.maxCharges,
        isExhausted: false,
    };
}
