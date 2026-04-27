// Runs Job in Background
// Use cases: Send Email, Clean up some stuff, etc

type Task = () => Promise<void> | void;

interface Job {
    fn: Task;
    retries: number;
}

class BackgroundQueue {
    private queue: Job[] = [];
    private running = 0;

    constructor(
        private concurrency = 2,
        private defaultRetries = 0,
    ) {}

    add(fn: Task, retries = this.defaultRetries) {
        this.queue.push({ fn, retries });
        this.process();
    }

    private process() {
        while (this.running < this.concurrency && this.queue.length) {
            const job = this.queue.shift()!;
            this.running++;

            setImmediate(async () => {
                try {
                    await job.fn();
                } catch (err) {
                    if (job.retries > 0) {
                        job.retries--;
                        this.queue.push(job);
                    } else {
                        console.error("Background job failed:", err);
                    }
                } finally {
                    this.running--;
                    this.process();
                }
            });
        }
    }
}

export const background = new BackgroundQueue(3, 1);
