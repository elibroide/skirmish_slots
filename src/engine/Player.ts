import type { PlayerId, PlayerState, SlotCoord } from './types';
import type { GameEngine } from './GameEngine';
import { UnitCard, ActionCard, type Card } from './cards/Card';

export class Player implements PlayerState {
  id: PlayerId;
  hand: Card[] = [];
  deck: Card[] = [];
  graveyard: Card[] = [];
  sp: number = 0;
  skirmishesWon: number = 0;
  
  private engine: GameEngine;

  constructor(id: PlayerId, engine: GameEngine) {
    this.id = id;
    this.engine = engine;
  }

  /**
   * Draw cards from deck to hand.
   */
  async draw(amount: number = 1): Promise<void> {
    for (let i = 0; i < amount; i++) {
      if (this.deck.length === 0) break;
      
      const card = this.deck.pop()!;
      this.hand.push(card);

      await this.engine.emitEvent({
        type: 'CARD_DRAWN',
        playerId: this.id,
        count: 1, 
        cardId: card.id, 
      });
    }
  }

  /**
   * Discard cards from hand to graveyard.
   */
  async discard(amount: number = 1): Promise<void> {
    for (let i = 0; i < amount; i++) {
      if (this.hand.length === 0) break;
      
      // Default: Discard from end 
      const card = this.hand.pop()!;
      this.graveyard.push(card);

      await this.engine.emitEvent({
        type: 'CARD_DISCARDED',
        playerId: this.id,
        cardId: card.id,
        cardName: card.name,
      });
    }
  }

  /**
   * Pass the turn (done for the round).
   */
  async pass(): Promise<void> {
    this.engine.state.isDone[this.id] = true;
    
    // Check if both passed immediately? 
    // Usually the game loop/state checker handles this, or a TurnEnd/RoundEnd check.
    // For now, just emit the event and set flag.
    // The GameEngine might need to check for end of round after this action.
  }

  /**
   * Play a card from hand.
   */
  async playCard(cardId: string, targetSlot?: SlotCoord): Promise<void> {
    // 1. Find and remove card from hand
    const cardIndex = this.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      throw new Error(`Card ${cardId} not found in hand`);
    }

    const card = this.hand[cardIndex];
    this.hand.splice(cardIndex, 1);

    // 2. Emit Event
    await this.engine.emitEvent({
      type: 'CARD_PLAYED',
      playerId: this.id,
      cardId: card.id,
      cardName: card.name,
      cardType: card.getType(),
      targetSlot: targetSlot,
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
      this.graveyard.push(card);
    }
  }
}

