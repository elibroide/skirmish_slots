
import { HumanController } from '../../controllers/HumanController';
import { GameEngine } from '../../core/GameEngine';

// Simple Test Controller that auto-resolves requests
export class TestController extends HumanController {
    private engine: GameEngine | undefined;

    setEngine(engine: GameEngine) {
        this.engine = engine;
    }

    onEvent(event: any): void {
        super.onEvent(event);
        if (event.type === 'INPUT_REQUIRED' && event.playerId === this.playerId && this.engine) {
            const request = event.inputRequest;
            // Auto-pick first valid slot for targeting
            if (request.type === 'target' && request.validSlots && request.validSlots.length > 0) {
                // Submit input asynchronously to break stack? 
                // Or synchronously is fine if submitInput handles it.
                // Ideally next tick to mimic async input.
                setTimeout(() => {
                    this.engine!.submitInput(request.validSlots[0]);
                }, 0);
            }
        }
    }
}
