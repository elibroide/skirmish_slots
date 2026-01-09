import { HumanController } from '../../controllers/HumanController';
import { GameEngine } from '../../core/GameEngine';
export declare class TestController extends HumanController {
    private engine;
    setEngine(engine: GameEngine): void;
    onEvent(event: any): void;
}
