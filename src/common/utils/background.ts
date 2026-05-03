// Runs Job in Background
// Use cases: Send Email, Clean up some stuff, etc

type Task = () => Promise<void> | void;

interface Job {
    fn: Task;
    retries: number;
}

class BackgroundRunner {
    private active = new Set<Promise<void>>();

    constructor(
        private concurrency = 2,
        private defaultRetries = 0,
    ) {}

    add(fn: Task, retries = this.defaultRetries) {
        const job: Job = { fn, retries };
        const promise = this.scheduleJob(job);

        this.active.add(promise);
        promise.finally(() => {
            this.active.delete(promise);
        });
    }

    private async scheduleJob(job: Job) {
        if (this.active.size >= this.concurrency) {
            await Promise.race(this.active);
        }

        await this.runJob(job);
    }

    private async runJob(job: Job) {
        while (true) {
            try {
                await job.fn();
                return;
            } catch (err) {
                if (job.retries > 0) {
                    job.retries--;
                    continue;
                }

                console.error("Background job failed:", err);
                return;
            }
        }
    }
}

export const background = new BackgroundRunner(3, 1);
