import type { GameAction, GameState, PlayerId } from '../types';
import type { AIPlayer } from './AIPlayer';
import type { Card } from '../cards/Card';
import type { SeededRNG } from '../SeededRNG';

/**
 * Simple random AI that:
 * - Declares done if it has no cards in hand
 * - Plays random cards
 * - Uses card.selectDefaultTarget() to find valid moves
 */
export class RandomAI implements AIPlayer {
  private rng?: SeededRNG;
  
  constructor(public playerId: PlayerId, rng?: SeededRNG) {
    this.rng = rng;
  }

  decideAction(state: GameState): GameAction | null {
    const player = state.players[this.playerId];

    // Declare done if we have no cards in hand
    if (player.hand.length === 0) {
      return {
        type: 'PASS',
        playerId: this.playerId,
      };
    }

    // Shuffle hand to pick random card (use seeded RNG if available)
    const shuffledHand = [...player.hand];
    if (this.rng) {
      this.rng.shuffle(shuffledHand);
    } else {
      shuffledHand.sort(() => Math.random() - 0.5);
    }

    for (const card of shuffledHand) {
        // Try to find a valid target for this card
        // We need to cast to Card class to access methods (since state.hand is raw data usually, 
        // but in this engine implementation, hand contains class instances? 
        // Let's assume they are instances based on GameEngine.ts usage)
        const cardInstance = card as Card;
        
        // Use the card's built-in target selection logic
        const targetSlot = cardInstance.selectDefaultTarget(state);

        // If card needs a target but none found, skip it
        if (cardInstance.needsTarget() && !targetSlot) {
            continue;
        }

        // If card is a unit, it must have a deployment target (which selectDefaultTarget provides)
        if (cardInstance.getType() === 'unit' && !targetSlot) {
            continue;
        }

        // Construct action
        return {
            type: 'PLAY_CARD',
            playerId: this.playerId,
            cardId: card.id,
            targetSlot: targetSlot || undefined, // undefined for non-targeting actions
        };
    }

    // If no valid moves found (e.g. board full and no consume allowed), pass
    return {
        type: 'PASS',
        playerId: this.playerId,
    };
  }
}
