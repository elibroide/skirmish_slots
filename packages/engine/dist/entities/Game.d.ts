import { GameEntity } from './base/GameEntity';
import type { GameEngine } from '../core/GameEngine';
import type { PlayerId } from '../core/types';
export interface SkirmishRecord {
    id: number;
    status: 'ONGOING' | 'CONCLUDED';
    winner: PlayerId | 'TIE' | null;
    scores: Record<PlayerId, number>;
}
export declare class Game extends GameEntity {
    private _currentSkirmish;
    private _currentTurn;
    private _currentPlayer;
    private _tieSkirmishes;
    private _matchWinner;
    private _skirmishHistory;
    constructor(engine: GameEngine);
    private initializeSkirmish;
    get currentSkirmish(): number;
    get currentTurn(): number;
    get currentPlayer(): PlayerId;
    get tieSkirmishes(): number;
    get matchWinner(): PlayerId | undefined;
    get skirmishHistory(): ReadonlyArray<SkirmishRecord>;
    startSkirmish(): void;
    endSkirmish(winner: PlayerId | null): void;
    passTurn(): void;
    setWinner(winner: PlayerId): void;
    updateScore(playerId: PlayerId, score: number): void;
    setCurrentPlayer(playerId: PlayerId): void;
    toState(): {
        currentSkirmish: number;
        currentTurn: number;
        currentPlayer: PlayerId;
        tieSkirmishes: number;
        matchWinner: PlayerId | undefined;
    };
}
