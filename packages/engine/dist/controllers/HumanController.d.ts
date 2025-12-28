import type { GameEvent, PlayerId } from '../core/types';
import type { PlayerController } from './PlayerController';
/**
 * Controller for human players.
 * Humans interact via UI, so this controller does nothing on events.
 */
export declare class HumanController implements PlayerController {
    playerId: PlayerId;
    readonly type: "human";
    constructor(playerId: PlayerId);
    onEvent(event: GameEvent): void;
}
