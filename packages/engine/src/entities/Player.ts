import { PlayerGameEntity } from './base/PlayerGameEntity';
import type { PlayerId, PlayerState, SlotCoord } from '../core/types';
import type { GameEngine } from '../core/GameEngine';
import { UnitCard, ActionCard, type Card } from '../mechanics/cards/Card';

export class Player extends PlayerGameEntity {
  public readonly id: PlayerId;
  
  private _hand: Card[] = [];
  private _deck: Card[] = [];
  private _graveyard: Card[] = [];
  private _sp: number = 0;
  private _skirmishesWon: number = 0;
  
  private _isDone: boolean = false;
  private _hasActedThisTurn: boolean = false;
  private _hasPlayedCardThisTurn: boolean = false;

  constructor(id: PlayerId, engine: GameEngine) {
    super(engine, id);
    this.id = id;
  }

  // Read-only accessors for Engine logic
  public get hand(): ReadonlyArray<Card> { return this._hand; }
  public get deck(): ReadonlyArray<Card> { return this._deck; }
  public get graveyard(): ReadonlyArray<Card> { return this._graveyard; }
  public get sp(): number { return this._sp; }
  public get skirmishesWon(): number { return this._skirmishesWon; }
  
  public get isDone(): boolean { return this._isDone; }
  public get hasActedThisTurn(): boolean { return this._hasActedThisTurn; }
  public get hasPlayedCardThisTurn(): boolean { return this._hasPlayedCardThisTurn; }

  // Snapshot generation for UI
  public toState(): PlayerState {
      // Return a pure data snapshot
      return {
          id: this.id,
          // CRITICAL: Return mapped state objects, not entity references
          hand: this._hand.map(c => c.toState()),
          deck: this._deck.map(c => c.toState()),
          graveyard: this._graveyard.map(c => c.toState()),
          sp: this._sp,
          skirmishesWon: this._skirmishesWon,
          isDone: this._isDone,
          hasActedThisTurn: this._hasActedThisTurn,
          hasPlayedCardThisTurn: this._hasPlayedCardThisTurn
      };
  }

  public setDeck(deck: Card[]) {
      this._deck = deck;
  }
  
  // Logic Helpers (Mutators)
  public markDone(): void {
      this._isDone = true;
  }
  
  public markActed(): void {
      this._hasActedThisTurn = true;
  }
  
  public markPlayedCard(): void {
      this._hasPlayedCardThisTurn = true;
      this.markActed(); // Playing a card counts as acting
  }
  
  public resetTurnFlags(): void {
      this._hasActedThisTurn = false;
      this._hasPlayedCardThisTurn = false;
  }
  
  public resetSkirmishFlags(): void {
      this._isDone = false;
      this.resetTurnFlags();
  }
  
  public async activateLeader(): Promise<void> {
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
  
  public resetSkirmishStats(): void {
      this._sp = 0;
  }
  
  public addSkirmishPoints(amount: number): void {
      this._sp += amount;
  }
  
  public get skirmishPoints(): number {
    return this._sp;
  }
  
  public addToGraveyard(card: Card): void {
      this._graveyard.push(card);
  }
  
  public incrementSkirmishesWon(): void {
      this._skirmishesWon++;
  }

  /**
   * Draw cards from deck to hand.
   */
  async draw(amount: number = 1): Promise<void> {
    const drawnCards = [];
    
    for (let i = 0; i < amount; i++) {
        if (this._deck.length === 0) break;
        const card = this._deck.pop()!;
        this._hand.push(card);
        drawnCards.push(card.toState());
    }

    if (drawnCards.length > 0) {
        // Emit batched event
        await this.engine.emitEvent({
            type: 'CARDS_DRAWN',
            playerId: this.id,
            count: drawnCards.length,
            cards: drawnCards
        });
    }
  }

  /**
   * Add a specific card to hand (e.g. created cards or bounced units).
   */
  async addToHand(card: Card): Promise<void> {
    this._hand.push(card);
    
    await this.engine.emitEvent({
        type: 'CARD_DRAWN',
        playerId: this.id,
        count: 1,
        card: card.toState(),
        entity: this
    });
  }

  /**
   * Discard cards from hand to graveyard.
   */
  async discard(amount: number = 1): Promise<void> {
    for (let i = 0; i < amount; i++) {
      if (this._hand.length === 0) break;
      
      // Default: Discard from end 
      const card = this._hand.pop()!;
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
  async pass(): Promise<void> {
    // Determine if player is locked out (Done) for the skirmish
    // 1. If didn't act this turn, they are passing without action -> Done
    // 2. If opponent is already Done, then this pass concludes the round -> Done
    const opponentId = (this.id + 1) % 2;
    const opponent = this.engine.getPlayer(opponentId as PlayerId);
    
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
  async playCard(cardId: string, targetSlot?: SlotCoord): Promise<void> {
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
      
    } else if (card instanceof ActionCard) {
      // Direct call to play
      await card.play(targetSlot);
      
      // Add to graveyard after playing action
      this._graveyard.push(card);
    }
  }
}

