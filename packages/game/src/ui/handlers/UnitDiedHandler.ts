import { GameEvent } from '@skirmish/engine';
import { GameEventHandler } from './GameEventHandler';
import { useGameStore } from '../../store/gameStore';

export class UnitDiedHandler implements GameEventHandler {
    async handle(event: GameEvent): Promise<void> {
        if (event.type !== 'UNIT_DIED') return;
        
        // Logic to clear slot
        if (event.terrainId !== undefined) {
             const players = useGameStore.getState().players;
             const clearSlot = useGameStore.getState().clearSlot;
             
             // Find owner
             ([0, 1] as const).forEach(pid => {
                 // Safe check for content existence
                 if (players[pid].slots[event.terrainId]?.content?.cardId === event.unitId) {
                     clearSlot(pid, event.terrainId);
                 }
             });
        }
    }
}
