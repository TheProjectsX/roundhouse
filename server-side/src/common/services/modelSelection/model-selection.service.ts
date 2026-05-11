import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

export interface ModelSelectionStats {
    modelSelectionId: string;
    tokenUsage: number;
    successCount?: number;
    failureCount?: number;
    lastUsedAt?: Date;
}

@Injectable()
export class ModelSelectionService {
    constructor(private prisma: PrismaService) {}

    /**
     * Update model selection statistics in background (async)
     * This should be called after an API request completes
     */
    async updateModelSelectionStatsAsync(
        modelSelectionId: string,
        stats: Partial<ModelSelectionStats>,
    ): Promise<void> {
        // Offload to background - return immediately
        this.updateModelSelectionStats(modelSelectionId, stats).catch((err) => {
            console.error(
                `Failed to update model selection stats: ${modelSelectionId}`,
                err,
            );
        });
    }

    /**
     * Synchronous model selection update (for when we need to wait)
     */
    async updateModelSelectionStats(
        modelSelectionId: string,
        stats: Partial<ModelSelectionStats>,
    ) {
        const updateData: Prisma.ModelSelectionUpdateInput = {
            updatedAt: new Date(),
        };

        if (stats.tokenUsage !== undefined) {
            updateData.tokenUsage = {
                increment: stats.tokenUsage,
            };
        }

        if (stats.successCount !== undefined && stats.successCount > 0) {
            updateData.successCount = {
                increment: stats.successCount,
            };
        }

        if (stats.failureCount !== undefined && stats.failureCount > 0) {
            updateData.failureCount = {
                increment: stats.failureCount,
            };
        }

        if (stats.lastUsedAt !== undefined) {
            updateData.lastUsedAt = stats.lastUsedAt;
        }

        return this.prisma.modelSelection.update({
            where: { id: modelSelectionId },
            data: updateData,
        });
    }

    /**
     * Get model selection with all statistics
     */
    async getModelSelectionWithStats(modelSelectionId: string) {
        return this.prisma.modelSelection.findUnique({
            where: { id: modelSelectionId },
            include: {
                model: true,
                userModel: true,
                providerSelection: true,
            },
        });
    }

    /**
     * Get all model selections for a provider selection with stats
     */
    async getProviderModelSelections(providerSelectionId: string) {
        return this.prisma.modelSelection.findMany({
            where: { providerSelectionId },
            include: {
                model: true,
                userModel: true,
            },
            orderBy: { createdAt: "desc" },
        });
    }

    /**
     * Bulk update multiple model selection statistics in a single transaction
     * This reduces DB roundtrips from N to 1 when updating multiple records
     */
    async bulkUpdateModelSelectionStats(
        updates: Array<{
            modelSelectionId: string;
            stats: Partial<ModelSelectionStats>;
        }>,
    ) {
        if (updates.length === 0) {
            return [];
        }

        // Use transaction to ensure all updates succeed or all fail
        return this.prisma.$transaction(
            updates.map((update) => {
                const updateData: Prisma.ModelSelectionUpdateInput = {
                    updatedAt: new Date(),
                };

                const stats = update.stats;

                if (stats.tokenUsage !== undefined) {
                    updateData.tokenUsage = {
                        increment: stats.tokenUsage,
                    };
                }

                if (
                    stats.successCount !== undefined &&
                    stats.successCount > 0
                ) {
                    updateData.successCount = {
                        increment: stats.successCount,
                    };
                }

                if (
                    stats.failureCount !== undefined &&
                    stats.failureCount > 0
                ) {
                    updateData.failureCount = {
                        increment: stats.failureCount,
                    };
                }

                if (stats.lastUsedAt !== undefined) {
                    updateData.lastUsedAt = stats.lastUsedAt;
                }

                return this.prisma.modelSelection.update({
                    where: { id: update.modelSelectionId },
                    data: updateData,
                });
            }),
        );
    }
}
