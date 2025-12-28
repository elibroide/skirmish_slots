import { PlayerGameEntity } from './base/PlayerGameEntity';
import type { PlayerId, PlayerState, SlotCoord } from '../core/types';
import type { GameEngine } from '../core/GameEngine';
import { type Card } from '../mechanics/cards/Card';
export declare class Player extends PlayerGameEntity {
    readonly id: PlayerId;
    private _hand;
    private _deck;
    private _graveyard;
    private _sp;
    private _skirmishesWon;
    private _isDone;
    private _hasActedThisTurn;
    private _hasPlayedCardThisTurn;
    constructor(id: PlayerId, engine: GameEngine);
    get hand(): ReadonlyArray<Card>;
    get deck(): ReadonlyArray<Card>;
    get graveyard(): ReadonlyArray<Card>;
    get sp(): number;
    get skirmishesWon(): number;
    get isDone(): boolean;
    get hasActedThisTurn(): boolean;
    get hasPlayedCardThisTurn(): boolean;
    toState(): PlayerState;
    setDeck(deck: Card[]): void;
    markDone(): void;
    markActed(): void;
    markPlayedCard(): void;
    resetTurnFlags(): void;
    resetSkirmishFlags(): void;
    activateLeader(): Promise<void>;
    resetSkirmishStats(): void;
    addSkirmishPoints(amount: number): void;
    get skirmishPoints(): number;
    addToGraveyard(card: Card): void;
    incrementSkirmishesWon(): void;
    /**
     * Draw cards from deck to hand.
     */
    draw(amount?: number): Promise<void>;
    /**
     * Add a specific card to hand (e.g. created cards or bounced units).
     */
    addToHand(card: Card): Promise<void>;
    /**
     * Discard cards from hand to graveyard.
     */
    discard(amount?: number): Promise<void>;
    /**
     * Pass the turn (done for the round).
     */
    pass(): Promise<void>;
    /**
     * Play a card from hand.
     */
    playCard(cardId: string, targetSlot?: SlotCoord): Promise<void>;
}
