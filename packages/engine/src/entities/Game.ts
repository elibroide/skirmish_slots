import { GameEntity } from './base/GameEntity';
import type { GameEngine } from '../core/GameEngine';
import type { PlayerId, GameState } from '../core/types';

export interface SkirmishRecord {
  id: number;
  status: 'ONGOING' | 'CONCLUDED';
  winner: PlayerId | 'TIE' | null;
  scores: Record<PlayerId, number>;
}

export class Game extends GameEntity {
  private _currentSkirmish: number = 1;
  private _currentTurn: number = 1;
  private _currentPlayer: PlayerId = 0;
  private _tieSkirmishes: number = 0;
  private _matchWinner: PlayerId | undefined;
  
  private _skirmishHistory: SkirmishRecord[] = [];

  constructor(engine: GameEngine) {
    super(engine);
    this.initializeSkirmish();
  }

  private initializeSkirmish() {
    this._skirmishHistory.push({
      id: this._currentSkirmish,
      status: 'ONGOING',
      winner: null,
      scores: { 0: 0, 1: 0 }
    });
  }

  // Accessors
  public get currentSkirmish(): number { return this._currentSkirmish; }
  public get currentTurn(): number { return this._currentTurn; }
  public get currentPlayer(): PlayerId { return this._currentPlayer; }
  public get tieSkirmishes(): number { return this._tieSkirmishes; }
  public get matchWinner(): PlayerId | undefined { return this._matchWinner; }
  public get skirmishHistory(): ReadonlyArray<SkirmishRecord> { return this._skirmishHistory; }

  // Logic
  public startSkirmish(): void {
    // Logic moved from StartSkirmishEffect? Or just state tracking?
    // Often effect drives this, but entity holds state.
    const hands = {
        0: this.engine.players[0] ? [...this.engine.players[0].hand] : [],
        1: this.engine.players[1] ? [...this.engine.players[1].hand] : []
    };
    
    this.engine.emitEvent({
      type: 'SKIRMISH_STARTED',
      skirmishNumber: this._currentSkirmish,
      hands,
      entity: this
    });
  }

  public endSkirmish(winner: PlayerId | null): void {
    const p0 = this.engine.getPlayer(0).skirmishPoints;
    const p1 = this.engine.getPlayer(1).skirmishPoints;

    const currentRecord = this._skirmishHistory.find(s => s.id === this._currentSkirmish);
    if (currentRecord) {
      currentRecord.status = 'CONCLUDED';
      currentRecord.winner = winner === null ? 'TIE' : winner;
      currentRecord.scores = { 0: p0, 1: p1 };
    }

    // Emit SKIRMISH_ENDED
    this.engine.emitEvent({
        type: 'SKIRMISH_ENDED',
        skirmishNumber: this._currentSkirmish,
        winner,
        sp: [p0, p1],
        entity: this
    });

    if (winner === null) {
      this._tieSkirmishes++;
    }
    
    // Prepare next
    this._currentSkirmish++;
    this.initializeSkirmish();
  }

  public passTurn(): void {
    this._currentTurn++;
    // Toggle player? Usually handled by GameEngine logic based on who passed.
    // This entity mostly just tracks the numbers.
  }

  public setWinner(winner: PlayerId): void {
    this._matchWinner = winner;
    this.engine.emitEvent({
      type: 'MATCH_ENDED',
      winner,
      entity: this
    });
  }

  public updateScore(playerId: PlayerId, score: number): void {
    const record = this._skirmishHistory.find(s => s.id === this._currentSkirmish);
    if (record) {
      record.scores[playerId] = score;
    }
  }

  public setCurrentPlayer(playerId: PlayerId): void {
    const old = this._currentPlayer;
    this._currentPlayer = playerId;
    if (old !== playerId) {
        // Emit? 'TURN_CHANGED' usually means turn number increment, 
        // but 'ACTIVE_PLAYER_CHANGED' is different.
        // Existing engine treats TURN_CHANGED as "New Turn Started".
    }
  }

  public toState() {
     return {
        currentSkirmish: this._currentSkirmish,
        currentTurn: this._currentTurn,
        currentPlayer: this._currentPlayer,
        tieSkirmishes: this._tieSkirmishes,
        matchWinner: this._matchWinner,
        // history: this._skirmishHistory // TODO: Add to GameState type if needed
     };
  }
}
