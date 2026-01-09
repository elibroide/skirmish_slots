import { HumanController } from '../../controllers/HumanController';
import { GameEngine } from '../../core/GameEngine';
import { PlayerId, TerrainId } from '../../core/types';
export interface ScriptedCommand {
    type: 'PLAY' | 'PASS';
    cardName?: string;
    cardId?: string;
    target?: number | {
        terrainId: TerrainId;
        playerId: PlayerId;
    };
    input?: any;
}
export declare class ScriptedController extends HumanController {
    private engine;
    private commandQueue;
    private pendingInput;
    constructor(playerId: PlayerId, commands?: ScriptedCommand[]);
    setEngine(engine: GameEngine): void;
    addCommand(command: ScriptedCommand): void;
    onEvent(event: any): void;
    private processNextCommand;
    private processInput;
}
