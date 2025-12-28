import { GameEngine } from '../core/GameEngine';
import type { Card } from '../mechanics/cards/Card';
import type { PlayerController } from '../controllers/PlayerController';
/**
 * Initialize a new game with two controllers
 * By default: Player 0 = Human, Player 1 = AI
 */
export declare function initializeGame(controller0?: PlayerController, controller1?: PlayerController, deck1?: Card[], deck2?: Card[]): GameEngine;
