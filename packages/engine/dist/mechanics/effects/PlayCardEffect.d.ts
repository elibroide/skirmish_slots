import { Effect } from './Effect';
import type { EffectResult, GameState, PlayerId, SlotCoord } from '../../core/types';
/**
 * Effect that handles playing a card from hand.
 * Wraps the PLAY_CARD action for consistent effect stack ordering.
 */
export declare class PlayCardEffect extends Effect {
    private playerId;
    private cardId;
    private targetSlot?;
    constructor(playerId: PlayerId, cardId: string, targetSlot?: SlotCoord | undefined);
    execute(state: GameState): Promise<EffectResult>;
    getDescription(): string;
}
