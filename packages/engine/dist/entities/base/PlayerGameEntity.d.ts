import { GameEntity } from './GameEntity';
import type { GameEngine } from '../../core/GameEngine';
import type { PlayerId, InputRequest } from '../../core/types';
/**
 * Base class for entities that are owned by a specific player.
 * Enables player-specific interactions like input requests.
 */
export declare abstract class PlayerGameEntity extends GameEntity {
    owner: PlayerId;
    constructor(engine: GameEngine, owner: PlayerId);
    /**
     * Request player input (targeting, modal choices, etc.)
     * This method suspends execution until player provides input.
     */
    requestInput(request: InputRequest): Promise<any>;
}
