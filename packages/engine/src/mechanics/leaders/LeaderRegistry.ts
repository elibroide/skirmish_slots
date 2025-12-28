import type { LeaderDefinition, LeaderState, PlayerId } from '../../core/types';
import type { LeaderInstance, Leader } from './Leader';
import type { GameEngine } from '../../core/GameEngine';
import { Sage, Warlord } from './abilities';

/**
 * Leader Definitions - static data for all available leaders
 */
const LEADER_DEFINITIONS: Record<string, LeaderDefinition> = {
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
const LEADER_CLASSES: Record<string, new (engine: GameEngine, owner: PlayerId, definition: LeaderDefinition) => Leader> = {
  sage: Sage,
  warlord: Warlord,
};

/**
 * Get a leader instance by ID
 * Returns definition and instantiated Leader (if any)
 */
export function getLeader(leaderId: string, engine: GameEngine, owner: PlayerId): LeaderInstance {
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
export function getLeaderDefinition(leaderId: string): LeaderDefinition {
  const definition = LEADER_DEFINITIONS[leaderId];
  if (!definition) {
    throw new Error(`Unknown leader: ${leaderId}`);
  }
  return definition;
}

/**
 * Get all available leader IDs
 */
export function getAllLeaderIds(): string[] {
  return Object.keys(LEADER_DEFINITIONS);
}

/**
 * Create initial leader state for a player
 */
export function createLeaderState(leaderId?: string): LeaderState {
  const id = leaderId || 'rookie';
  const definition = getLeaderDefinition(id);
  return {
    leaderId: id,
    currentCharges: definition.maxCharges,
    isExhausted: false,
  };
}
