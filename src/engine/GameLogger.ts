import type {
  GameAction,
  GameState,
  PlayerId,
  PlayerInfo,
  GameLogEntry,
  GameLog,
  SimplifiedGameState,
  GameResult,
  TerrainId
} from './types';
import type { Card } from './cards/Card';

/**
 * GameLogger - Captures all game actions with full context and AI reasoning
 * 
 * Features:
 * - In-memory storage of all actions
 * - Includes AI reasoning for each decision
 * - Simplified state snapshots for analysis
 * - JSON export for download and replay
 */
export class GameLogger {
  private gameId: string;
  private startTime: Date;
  private actions: GameLogEntry[];
  private players: [PlayerInfo, PlayerInfo];
  private turnCounter: number;
  private gameResult: GameResult | null;

  constructor(player0Info: PlayerInfo, player1Info: PlayerInfo) {
    this.gameId = this.generateGameId();
    this.startTime = new Date();
    this.actions = [];
    this.players = [player0Info, player1Info];
    this.turnCounter = 0;
    this.gameResult = null;
  }

  /**
   * Log a game action with optional AI reasoning
   */
  logAction(
    action: GameAction,
    playerType: 'human' | 'ai',
    state: GameState,
    reasoning?: string
  ): void {
    this.turnCounter++;

    const entry: GameLogEntry = {
      turn: this.turnCounter,
      player: action.playerId,
      playerType,
      actionType: action.type,
      details: this.extractActionDetails(action, state),
      reasoning: reasoning || null,
      timestamp: new Date().toISOString(),
      gameStateSnapshot: this.simplifyState(state)
    };

    this.actions.push(entry);
  }

  /**
   * Record the final game result
   */
  setResult(winner: PlayerId | null, state: GameState): void {
    this.gameResult = {
      winner,
      finalScore: [
        state.players[0].skirmishesWon,
        state.players[1].skirmishesWon
      ],
      totalTurns: this.turnCounter
    };
  }

  /**
   * Get the complete game log
   */
  getFullLog(): GameLog {
    return {
      gameId: this.gameId,
      timestamp: this.startTime.toISOString(),
      players: this.players,
      result: this.gameResult,
      actions: this.actions
    };
  }

  /**
   * Get recent action history (for AI context)
   */
  getHistory(count: number = 10): GameLogEntry[] {
    return this.actions.slice(-count);
  }

  /**
   * Export log as JSON string
   */
  exportToJSON(): string {
    return JSON.stringify(this.getFullLog(), null, 2);
  }

  /**
   * Clear all logged actions (for new game)
   */
  clear(): void {
    this.actions = [];
    this.turnCounter = 0;
    this.gameResult = null;
    this.gameId = this.generateGameId();
    this.startTime = new Date();
  }

  /**
   * Generate a unique game ID
   */
  private generateGameId(): string {
    return `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simplify game state for logging
   */
  private simplifyState(state: GameState): SimplifiedGameState {
    return {
      currentSkirmish: state.currentSkirmish,
      currentPlayer: state.currentPlayer,
      scores: {
        player0: {
          sp: state.players[0].sp,
          skirmishesWon: state.players[0].skirmishesWon
        },
        player1: {
          sp: state.players[1].sp,
          skirmishesWon: state.players[1].skirmishesWon
        }
      },
      terrains: state.terrains.map(terrain => ({
        id: terrain.id,
        winner: terrain.winner,
        units: [
          terrain.slots[0].unit ? {
            name: terrain.slots[0].unit.name,
            power: terrain.slots[0].unit.power
          } : null,
          terrain.slots[1].unit ? {
            name: terrain.slots[1].unit.name,
            power: terrain.slots[1].unit.power
          } : null
        ]
      })),
      handSizes: [
        state.players[0].hand.length,
        state.players[1].hand.length
      ],
      deckSizes: [
        state.players[0].deck.length,
        state.players[1].deck.length
      ]
    };
  }

  /**
   * Extract human-readable action details
   */
  private extractActionDetails(action: GameAction, state: GameState): any {
    switch (action.type) {
      case 'PLAY_CARD': {
        const card = this.findCard(action.cardId, state.players[action.playerId]);
        return {
          cardId: action.cardId,
          cardName: card?.name || 'Unknown',
          cardType: card?.getType() || 'unknown',
          targetSlot: action.targetSlot || null
        };
      }

      case 'DONE': {
        return {
          action: 'pass'
        };
      }

      case 'ACTIVATE': {
        const unit = this.findUnit(action.unitId, state);
        return {
          unitId: action.unitId,
          unitName: unit?.name || 'Unknown'
        };
      }

      default:
        return { ...action };
    }
  }

  /**
   * Find a card in player's hand, deck, or graveyard
   */
  private findCard(cardId: string, player: { hand: Card[]; deck: Card[]; graveyard: Card[] }): Card | null {
    return player.hand.find(c => c.id === cardId) ||
           player.deck.find(c => c.id === cardId) ||
           player.graveyard.find(c => c.id === cardId) ||
           null;
  }

  /**
   * Find a unit on the battlefield
   */
  private findUnit(unitId: string, state: GameState): any | null {
    for (const terrain of state.terrains) {
      if (terrain.slots[0].unit?.id === unitId) return terrain.slots[0].unit;
      if (terrain.slots[1].unit?.id === unitId) return terrain.slots[1].unit;
    }
    return null;
  }
}

