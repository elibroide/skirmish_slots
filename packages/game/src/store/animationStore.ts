import { create } from 'zustand';
import { AnimationConfig } from './gameStore';

export interface AnimationTask {
    id: string;
    type: 'card_play'; // Extendable
    config: AnimationConfig;
    payload: any;
    startTime?: number;
    resolve?: () => void;
}

interface AnimationState {
    queue: AnimationTask[];
    activeTasks: AnimationTask[];

    // Actions
    play: (task: AnimationTask) => Promise<void>;
    complete: (taskId: string) => void;
    triggerNext: (taskId: string) => void;
    
    // Internal Logic
    processQueue: (forceNext?: boolean) => void;
    startTask: (task: AnimationTask) => void;
}

export const useAnimationStore = create<AnimationState>((set, get) => ({
    queue: [],
    activeTasks: [],

    play: (task: AnimationTask) => {
        // Ensure ID
        if (!task.id) task.id = crypto.randomUUID();
        
        console.log(`[AnimationStore] Enqueuing task: ${task.type} (${task.id})`);

        return new Promise<void>((resolve) => {
            const taskWithResolve = { ...task, resolve };
            
            set((state) => ({
                queue: [...state.queue, taskWithResolve]
            }));

            // Trigger processing
            get().processQueue(false);
        });
    },

    complete: (taskId: string) => {
        console.log(`[AnimationStore] Task Complete & Removed: ${taskId}`);
        const state = get();
        const task = state.activeTasks.find(t => t.id === taskId);
        
        set((s) => ({
            activeTasks: s.activeTasks.filter(t => t.id !== taskId)
        }));

        // Resolve the promise via the stored callback
        if (task && task.resolve) {
            task.resolve();
        }

        // Check if more can start
        get().processQueue(false);
    },

    triggerNext: (taskId: string) => {
        console.log(`[AnimationStore] triggerNext called by task: ${taskId}`);
        get().processQueue(true);
    },

    processQueue: (forceNext = false) => {
        const state = get();
        if (state.queue.length === 0) return;

        // Choreography Logic:
        // 1. If no active tasks, start immediately.
        if (state.activeTasks.length === 0) {
            get().startTask(state.queue[0]);
            return;
        }

        // 2. If active tasks exist, we ONLY start if 'forceNext' is true
        if (forceNext) {
            get().startTask(state.queue[0]);
        }
    },

    startTask: (task: AnimationTask) => {
        console.log(`[AnimationStore] Starting task: ${task.id}`);
        
        set((state) => ({
            // Remove from queue
            queue: state.queue.filter(t => t.id !== task.id),
            // Add to active
            activeTasks: [...state.activeTasks, { ...task, startTime: Date.now() }]
        }));

        // Check if this task triggers next IMMEDIATELY
        if (task.config.triggerNextOn === 'start') {
             console.log(`[AnimationStore] Task ${task.id} triggers next on START`);
             get().processQueue(true);
        }
    }
}));
