
import { HumanController } from '../../controllers/HumanController';
import { GameEngine } from '../../core/GameEngine';
import { PlayerId, TerrainId } from '../../core/types';

export interface ScriptedCommand {
    type: 'PLAY' | 'PASS';
    cardName?: string;
    cardId?: string;
    target?: number | { terrainId: TerrainId; playerId: PlayerId }; // For deployment
    input?: any; // For subsequent input requests (e.g. effect targeting)
    // If we need explicit distinct input steps, we can add them, 
    // but usually 'target' on PLAY implies the target for the logical action or the immediate input.
}

export class ScriptedController extends HumanController {
    private engine: GameEngine | undefined;
    private commandQueue: ScriptedCommand[] = [];
    private pendingInput: any = null;

    constructor(playerId: PlayerId, commands: ScriptedCommand[] = []) {
        super(playerId);
        this.commandQueue = [...commands];
    }

    setEngine(engine: GameEngine) {
        this.engine = engine;
    }

    addCommand(command: ScriptedCommand) {
        this.commandQueue.push(command);
    }

    onEvent(event: any): void {
        super.onEvent(event);
        
        // Handle Action Requests (It's my turn to do something)
        if (event.type === 'ACTION_REQUIRED' && event.playerId === this.playerId && this.engine) {
            this.processNextCommand();
        }

        // Handle Input Requests (The card I played needs a target)
        if (event.type === 'INPUT_REQUIRED' && event.playerId === this.playerId && this.engine) {
            this.processInput(event.inputRequest);
        }
    }

    private processNextCommand() {
        if (this.commandQueue.length === 0) {
            // No commands - fallback to passing or do nothing (wait)
            // Ideally we pass to avoid hanging, or we warn.
            console.warn(`P${this.playerId} has no scripted commands left for ACTION_REQUIRED`);
            return;
        }

        const cmd = this.commandQueue.shift()!;
        
        if (cmd.type === 'PASS') {
            setTimeout(() => {
                this.engine!.submitAction({
                    type: 'PASS',
                    playerId: this.playerId
                });
            }, 0);
        } else if (cmd.type === 'PLAY') {
            const player = this.engine!.getPlayer(this.playerId);
            let card;
            
            if (cmd.cardId) {
                card = player.hand.find(c => c.id === cmd.cardId);
            } else if (cmd.cardName) {
                card = player.hand.find(c => c.name.toLowerCase() === cmd.cardName!.toLowerCase());
            }

            if (!card) {
                throw new Error(`ScriptedController P${this.playerId}: Card not found for command ${JSON.stringify(cmd)}`);
            }

            // If this command has a target (e.g. deploy location OR effect target), capture it for potential INPUT_REQUIRED
            // Note: PLAY_CARD action might take targetSlot immediately for deployment.
            // But secondary targets (Archer effect) come via INPUT_REQUIRED.
            
            // Heuristic: If deployment target is needed, it's usually the first 'target' param.
            // If the card is 'Archer', it needs a deployment slot AND a target.
            // Using the simple "recorder" model, we might need a list of inputs.
            // But for now let's assume `target` in command covers the primary interaction.
            
            // Standard PLAY_CARD with targetSlot
            let targetSlot = undefined;
            if (cmd.target !== undefined) {
                 if (typeof cmd.target === 'number') {
                     targetSlot = { terrainId: cmd.target as TerrainId, playerId: this.playerId };
                 } else {
                     targetSlot = cmd.target;
                 }
            }
            
            // Set pending input for potential reaction
            if (cmd.input) {
                this.pendingInput = cmd.input;
            } else if (targetSlot) {
                // Fallback: recycle deployment target if no explicit input given (legacy behavior)
                // But risky if self-target is wrong.
                this.pendingInput = targetSlot;
            }

            setTimeout(() => {
                this.engine!.submitAction({
                    type: 'PLAY_CARD',
                    playerId: this.playerId,
                    cardId: card!.id,
                    targetSlot: targetSlot
                });
            }, 0);
        }
    }

    private processInput(request: any) {
        // console.log('ScriptedController Input Request:', JSON.stringify(request));
        // If we have pending input from the command config, use it first
        if (this.pendingInput) {
            const input = this.pendingInput;
            // console.log('ScriptedController Submitting Pending:', JSON.stringify(input));
            // Clear or keep? Some cards might need multiple inputs.
            // For now, clear.
            this.pendingInput = null;
            
            setTimeout(() => {
                this.engine!.submitInput(input);
            }, 0);
            return;
        }

        // Fallback: Auto-select valid options (like TestController)
        if (request.type === 'target' && request.validSlots && request.validSlots.length > 0) {
             console.log('ScriptedController Auto-selecting:', JSON.stringify(request.validSlots[0]));
             setTimeout(() => {
                this.engine!.submitInput(request.validSlots[0]);
            }, 0);
        }
    }
}
