import { Injectable, OnModuleInit } from "@nestjs/common";
import { ModelSelectionService } from "../modelSelection/model-selection.service";

export interface BackgroundTask {
    type: "model-selection-stats";
    modelSelectionId: string;
    tokenUsage: number;
    successCount?: number;
    failureCount?: number;
    lastUsedAt?: Date;
}

@Injectable()
export class BackgroundJobService implements OnModuleInit {
    private queue: BackgroundTask[] = [];
    private processing = false;
    private readonly BATCH_SIZE = 100;
    private readonly PROCESS_INTERVAL_MS = 1000; // Process every 1 second

    constructor(private modelSelectionService: ModelSelectionService) {}

    onModuleInit() {
        // Start background processor
        this.startBackgroundProcessor();
    }

    /**
     * Queue a background task (non-blocking)
     */
    queueTask(task: BackgroundTask): void {
        this.queue.push(task);
    }

    /**
     * Process queued tasks in batches
     */
    private startBackgroundProcessor(): void {
        setInterval(() => {
            if (this.queue.length > 0 && !this.processing) {
                this.processBatch();
            }
        }, this.PROCESS_INTERVAL_MS);
    }

    private async processBatch(): Promise<void> {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;
        try {
            // Take up to BATCH_SIZE tasks from queue
            const batch = this.queue.splice(0, this.BATCH_SIZE);

            // Group tasks by type for optimized bulk processing
            const modelSelectionStatsTasks = batch.filter(
                (task) => task.type === "model-selection-stats",
            );

            // Process model-selection-stats tasks in bulk
            if (modelSelectionStatsTasks.length > 0) {
                await this.modelSelectionService.bulkUpdateModelSelectionStats(
                    modelSelectionStatsTasks.map((task) => ({
                        modelSelectionId: task.modelSelectionId,
                        stats: {
                            tokenUsage: task.tokenUsage,
                            successCount: task.successCount,
                            failureCount: task.failureCount,
                            lastUsedAt: task.lastUsedAt,
                        },
                    })),
                );
            }

            // Log processing stats
            console.debug(
                `[BackgroundJob] Processed ${batch.length} tasks (${modelSelectionStatsTasks.length} model-selection-stats)`,
            );
        } catch (error) {
            console.error("Error processing background job batch:", error);
        } finally {
            this.processing = false;
        }
    }

    /**
     * Get current queue length (useful for monitoring)
     */
    getQueueLength(): number {
        return this.queue.length;
    }
}
