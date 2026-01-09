import { HumanController } from '../../controllers/HumanController';
// Simple Test Controller that auto-resolves requests
export class TestController extends HumanController {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "engine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    setEngine(engine) {
        this.engine = engine;
    }
    onEvent(event) {
        super.onEvent(event);
        if (event.type === 'INPUT_REQUIRED' && event.playerId === this.playerId && this.engine) {
            const request = event.inputRequest;
            // Auto-pick first valid slot for targeting
            if (request.type === 'target' && request.validSlots && request.validSlots.length > 0) {
                // Submit input asynchronously to break stack? 
                // Or synchronously is fine if submitInput handles it.
                // Ideally next tick to mimic async input.
                setTimeout(() => {
                    this.engine.submitInput(request.validSlots[0]);
                }, 0);
            }
        }
    }
}
