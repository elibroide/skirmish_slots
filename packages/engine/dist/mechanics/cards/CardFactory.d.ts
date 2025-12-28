import { UnitCard } from './Card';
import type { PlayerId } from '../../core/types';
import type { GameEngine } from '../../core/GameEngine';
import { type UnitCardId } from './cardDefinitions';
/**
 * Factory function to create unit cards from data definitions
 */
export declare function createUnitCard(cardId: UnitCardId, owner: PlayerId, engine: GameEngine): UnitCard;
