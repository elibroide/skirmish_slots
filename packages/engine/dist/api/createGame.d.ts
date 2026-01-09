import { PlayerId } from '../core/types';
import { GameEngine } from '../core/GameEngine';
export interface GameCreationResult {
    engine: GameEngine;
    localPlayerId: PlayerId;
    gameMode: string;
}
export declare const createGame: (localPlayerId: PlayerId, mode?: "vs-ai" | "human-vs-human" | "god-mode") => Promise<GameCreationResult>;
