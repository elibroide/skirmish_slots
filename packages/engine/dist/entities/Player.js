import { PlayerGameEntity } from './base/PlayerGameEntity';
import { UnitCard, ActionCard } from '../mechanics/cards/Card';
export class Player extends PlayerGameEntity {
    constructor(id, engine) {
        super(engine, id);
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_hand", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "_deck", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "_graveyard", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "_sp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "_skirmishesWon", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "_isDone", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "_hasActedThisTurn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "_hasPlayedCardThisTurn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        this.id = id;
    }
    // Read-only accessors for Engine logic
    get hand() { return this._hand; }
    get deck() { return this._deck; }
    get graveyard() { return this._graveyard; }
    get sp() { return this._sp; }
    get skirmishesWon() { return this._skirmishesWon; }
    get isDone() { return this._isDone; }
    get hasActedThisTurn() { return this._hasActedThisTurn; }
    get hasPlayedCardThisTurn() { return this._hasPlayedCardThisTurn; }
    // Snapshot generation for UI
    toState() {
        // Return a pure data snapshot
        return {
            id: this.id,
            // CRITICAL: Return copies of arrays so the store freezing them doesn't freeze the Engine's private state
            hand: [...this._hand],
            deck: [...this._deck],
            graveyard: [...this._graveyard],
            sp: this._sp,
            skirmishesWon: this._skirmishesWon,
            isDone: this._isDone,
            hasActedThisTurn: this._hasActedThisTurn,
            hasPlayedCardThisTurn: this._hasPlayedCardThisTurn
        };
    }
    setDeck(deck) {
        this._deck = deck;
    }
    // Logic Helpers (Mutators)
    markDone() {
        this._isDone = true;
    }
    markActed() {
        this._hasActedThisTurn = true;
    }
    markPlayedCard() {
        this._hasPlayedCardThisTurn = true;
        this.markActed(); // Playing a card counts as acting
    }
    resetTurnFlags() {
        this._hasActedThisTurn = false;
        this._hasPlayedCardThisTurn = false;
    }
    resetSkirmishFlags() {
        this._isDone = false;
        this.resetTurnFlags();
    }
    async activateLeader() {
        const leaderState = this.engine.leaders[this.id];
        // Mark as acted
        this.markActed();
        // Consume charge
        const oldCharges = leaderState.currentCharges;
        leaderState.currentCharges--;
        await this.engine.emitEvent({
            type: 'LEADER_CHARGES_CHANGED',
            playerId: this.id,
            oldCharges,
            newCharges: leaderState.currentCharges,
            entity: this
        });
        // Execute ability
        const { getLeader } = await import('../mechanics/leaders');
        const leader = getLeader(leaderState.leaderId, this.engine, this.id);
        if (leader.ability) {
            await leader.ability.execute();
        }
        await this.engine.emitEvent({
            type: 'LEADER_ABILITY_ACTIVATED',
            playerId: this.id,
            leaderId: leaderState.leaderId,
            abilityName: leader.definition.name,
            chargesRemaining: leaderState.currentCharges,
        });
    }
    resetSkirmishStats() {
        this._sp = 0;
    }
    addSkirmishPoints(amount) {
        this._sp += amount;
    }
    get skirmishPoints() {
        return this._sp;
    }
    addToGraveyard(card) {
        this._graveyard.push(card);
    }
    incrementSkirmishesWon() {
        this._skirmishesWon++;
    }
    /**
     * Draw cards from deck to hand.
     */
    async draw(amount = 1) {
        for (let i = 0; i < amount; i++) {
            if (this._deck.length === 0)
                break;
            const card = this._deck.pop();
            this._hand.push(card);
            await this.engine.emitEvent({
                type: 'CARD_DRAWN',
                playerId: this.id,
                count: 1,
                card: card,
            });
        }
    }
    /**
     * Add a specific card to hand (e.g. created cards or bounced units).
     */
    async addToHand(card) {
        this._hand.push(card);
        await this.engine.emitEvent({
            type: 'CARD_DRAWN',
            playerId: this.id,
            count: 1,
            card: card,
            entity: this
        });
    }
    /**
     * Discard cards from hand to graveyard.
     */
    async discard(amount = 1) {
        for (let i = 0; i < amount; i++) {
            if (this._hand.length === 0)
                break;
            // Default: Discard from end 
            const card = this._hand.pop();
            this._graveyard.push(card);
            await this.engine.emitEvent({
                type: 'CARD_DISCARDED',
                playerId: this.id,
                cardId: card.id,
                cardName: card.name,
                entity: this
            });
        }
    }
    /**
     * Pass the turn (done for the round).
     */
    async pass() {
        // Determine if player is locked out (Done) for the skirmish
        // 1. If didn't act this turn, they are passing without action -> Done
        // 2. If opponent is already Done, then this pass concludes the round -> Done
        const opponentId = (this.id + 1) % 2;
        const opponent = this.engine.getPlayer(opponentId);
        const isDone = !this._hasActedThisTurn || opponent.isDone;
        if (isDone) {
            this._isDone = true;
        }
        await this.engine.emitEvent({
            type: 'PLAYER_PASSED',
            playerId: this.id,
            isDone,
            entity: this
        });
    }
    /**
     * Play a card from hand.
     */
    async playCard(cardId, targetSlot) {
        // 1. Find and remove card from hand
        const cardIndex = this._hand.findIndex((c) => c.id === cardId);
        if (cardIndex === -1) {
            throw new Error(`Card ${cardId} not in hand`);
        }
        const card = this._hand[cardIndex];
        this._hand.splice(cardIndex, 1);
        // Mark played
        this.markPlayedCard();
        // 2. Emit Played Event
        await this.engine.emitEvent({
            type: 'CARD_PLAYED',
            playerId: this.id,
            cardId: card.id,
            cardName: card.name,
            cardType: card.getType(),
            targetSlot: targetSlot,
            entity: this // Player played it
        });
        // 3. Execute Card Logic
        if (card instanceof UnitCard) {
            // For units, terrainId comes from targetSlot
            if (!targetSlot) {
                throw new Error(`Unit ${card.name} played without target slot`);
            }
            // Direct call to deploy
            await card.deploy(targetSlot.terrainId);
        }
        else if (card instanceof ActionCard) {
            // Direct call to play
            await card.play(targetSlot);
            // Add to graveyard after playing action
            this._graveyard.push(card);
        }
    }
}
