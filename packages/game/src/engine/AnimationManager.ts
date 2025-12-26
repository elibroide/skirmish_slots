import { AnimationConfig } from '../store/gameStore';

export interface AnimationTask {
    id: string;
    type: 'card_play'; // Extendable for 'unit_death', 'projectile', etc.
    config: AnimationConfig;
    payload: any; // Flexible payload (CardInstance, positions, etc.)
    startTime?: number;
}

type Listener = (activeTasks: AnimationTask[]) => void;

export class AnimationManager {
    private static instance: AnimationManager;
    private queue: AnimationTask[] = [];
    private activeTasks: AnimationTask[] = [];
    private listeners: Listener[] = [];
    private processing = false;

    private constructor() { }

    public static getInstance(): AnimationManager {
        if (!AnimationManager.instance) {
            AnimationManager.instance = new AnimationManager();
        }
        return AnimationManager.instance;
    }

    public subscribe(listener: Listener): () => void {
        this.listeners.push(listener);
        listener(this.activeTasks); // Immediate update
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l([...this.activeTasks]));
    }

    public play(task: AnimationTask) {
        // Ensure ID
        if (!task.id) task.id = crypto.randomUUID();
        
        console.log(`[AnimationManager] Enqueuing task: ${task.type} (${task.id})`);
        this.queue.push(task);
        this.processQueue();
    }

    public complete(taskId: string) {
        console.log(`[AnimationManager] Task Complete & Removed: ${taskId}`);
        this.activeTasks = this.activeTasks.filter(t => t.id !== taskId);
        this.notify();
        this.processQueue(); // Check if more can start (e.g. if we were blocked)
    }

    public triggerNext(taskId: string) {
        console.log(`[AnimationManager] triggerNext called by task: ${taskId}`);
        // We only care if the task calling this is the "latest" active one,
        // or if we simply want to allow the *next* thing in the queue to proceed.
        // For simple sequential/parallel logic, we just try to process the queue.
        this.processQueue(true);
    }

    private processQueue(forceNext = false) {
        if (this.queue.length === 0) return;

        // Choreography Logic:
        // 1. If no active tasks, start immediately.
        if (this.activeTasks.length === 0) {
            this.startTask(this.queue[0]);
            return;
        }

        // 2. If active tasks exist, we ONLY start if 'forceNext' is true (triggered by event)
        //    OR if the current logic allows it (potentially parallel in future).
        //    For now, strict event-based: only start if explicitly triggered.
        if (forceNext) {
            this.startTask(this.queue[0]);
        }
    }

    private startTask(task: AnimationTask) {
        // Remove from queue
        this.queue.shift();
        
        // Mark start time
        task.startTime = Date.now(); 
        
        // Add to active
        this.activeTasks.push(task);
        console.log(`[AnimationManager] Starting task: ${task.id}`);
        this.notify();

        // Check if this task triggers next IMMEDIATELY (e.g. 'start')
        if (task.config.triggerNextOn === 'start') {
             // We need to defer this slightly to ensure the current task is fully registered? 
             // Or just call processQueue(true) immediately.
             // Immediate recursion is fine as long as queue isn't infinite.
             console.log(`[AnimationManager] Task ${task.id} triggers next on START`);
             this.processQueue(true);
        }
    }
}
