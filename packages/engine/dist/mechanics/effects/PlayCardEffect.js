import { Effect } from './Effect';
/**
 * Effect that handles playing a card from hand.
 * Wraps the PLAY_CARD action for consistent effect stack ordering.
 */
export class PlayCardEffect extends Effect {
    constructor(playerId, cardId, targetSlot) {
        super();
        Object.defineProperty(this, "playerId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: playerId
        });
        Object.defineProperty(this, "cardId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: cardId
        });
        Object.defineProperty(this, "targetSlot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: targetSlot
        });
    }
    async execute(state) {
        // Mark player as having acted this turn and played a card
        // Mark player as having acted this turn and played a card
        // This is handled inside player.playCard()
        // Queue TurnEndEffect (will be executed after any effects triggered by playing the card)
        const { TurnEndEffect } = await import('./TurnEndEffect');
        this.engine.addInterrupt(new TurnEndEffect());
        // Get player and play the card
        const player = this.engine.getPlayer(this.playerId);
        await player.playCard(this.cardId, this.targetSlot);
        // Events are emitted directly by player.playCard() and card logic
        return { newState: state, events: [] };
    }
    getDescription() {
        return `PlayCardEffect: Player ${this.playerId} plays card ${this.cardId}`;
    }
}
