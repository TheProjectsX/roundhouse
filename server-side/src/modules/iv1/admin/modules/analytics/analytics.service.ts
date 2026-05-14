import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/common/services/prisma/prisma.service";

@Injectable()
export class AdminAnalyticsService {
    constructor(private prisma: PrismaService) {}

    async fetchAdminAnalytics() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            [
                users,
                apiKeys,
                globalProviders,
                customProviders,
                models,
                userModels,
            ],
            usageStats,
            dailyUsage,
            topProvidersGlobal,
            topProvidersCustom,
            topModels,
        ] = await Promise.all([
            Promise.all([
                this.prisma.user.count({ where: { role: "USER" } }),
                this.prisma.apiKey.count(),
                this.prisma.provider.count(),
                this.prisma.userProvider.count(),
                this.prisma.model.count(),
                this.prisma.userModel.count(),
            ]),

            this.prisma.modelSelection.aggregate({
                _sum: {
                    tokenUsage: true,
                    successCount: true,
                    failureCount: true,
                },
            }),

            this.prisma.modelSelection.groupBy({
                by: ["createdAt"],
                where: {
                    createdAt: { gte: thirtyDaysAgo },
                },
                _sum: {
                    tokenUsage: true,
                    successCount: true,
                    failureCount: true,
                },
                orderBy: {
                    createdAt: "asc",
                },
            }),

            // Top Global Models
            this.prisma.modelSelection.groupBy({
                by: ["modelId"],
                _sum: {
                    successCount: true,
                    tokenUsage: true,
                },
                where: {
                    modelId: { not: null },
                },
                orderBy: {
                    _sum: {
                        successCount: "desc",
                    },
                },
                take: 5,
            }),
            // Top Custom Models
            this.prisma.modelSelection.groupBy({
                by: ["userModelId"],
                _sum: {
                    successCount: true,
                    tokenUsage: true,
                },
                where: {
                    userModelId: { not: null },
                },
                orderBy: {
                    _sum: {
                        successCount: "desc",
                    },
                },
                take: 5,
            }),

            this.prisma.model.findMany({
                take: 5,
                include: {
                    _count: {
                        select: {
                            modelSelections: true,
                        },
                    },
                },
                orderBy: {
                    modelSelections: {
                        _count: "desc",
                    },
                },
            }),
        ]);

        // Merge and sort raw results to get overall top 5
        const topProvidersRaw = [
            ...topProvidersGlobal.map((p) => ({ ...p, type: "global" })),
            ...topProvidersCustom.map((p) => ({ ...p, type: "custom" })),
        ]
            .sort(
                (a, b) =>
                    (b._sum.successCount || 0) - (a._sum.successCount || 0),
            )
            .slice(0, 5);

        // Fetch details for global models
        const globalModels = await this.prisma.model.findMany({
            where: {
                id: {
                    in: (topProvidersRaw as any[])
                        .filter((p) => p.modelId)
                        .map((p) => p.modelId as string),
                },
            },
            select: { id: true, name: true, code: true },
        });

        // Fetch details for user models
        const customModels = await this.prisma.userModel.findMany({
            where: {
                id: {
                    in: (topProvidersRaw as any[])
                        .filter((p) => p.userModelId)
                        .map((p) => p.userModelId as string),
                },
            },
            select: { id: true, name: true, code: true },
        });

        const modelMap = new Map(
            globalModels.map((m) => [m.id, { ...m, isCustom: false }]),
        );
        customModels.forEach((m) =>
            modelMap.set(m.id, { ...m, isCustom: true }),
        );

        const totalSuccess = usageStats._sum.successCount || 0;
        const totalFailure = usageStats._sum.failureCount || 0;
        const totalRequests = totalSuccess + totalFailure;

        const dailyTrendMap = dailyUsage.reduce(
            (acc, curr) => {
                const day = curr.createdAt.toISOString().split("T")[0];

                if (!acc[day]) {
                    acc[day] = {
                        tokens: 0,
                        requests: 0,
                        success: 0,
                        failure: 0,
                    };
                }

                const success = curr._sum.successCount || 0;
                const failure = curr._sum.failureCount || 0;

                acc[day].tokens += curr._sum.tokenUsage || 0;
                acc[day].success += success;
                acc[day].failure += failure;
                acc[day].requests += success + failure;

                return acc;
            },
            {} as Record<string, any>,
        );

        return {
            message: "Analytics fetched",
            data: {
                summary: {
                    users,
                    apiKeys,
                    globalProviders,
                    customProviders,
                    models,
                    userModels,
                    totalTokens: usageStats._sum.tokenUsage || 0,
                    totalRequests,
                    averageSuccessRate:
                        totalRequests > 0
                            ? (totalSuccess / totalRequests) * 100
                            : 0,
                },

                dailyTrend: Object.entries(dailyTrendMap).map(
                    ([date, stats]) => ({
                        date,
                        ...stats,
                    }),
                ),

                topProviders: topProvidersRaw.map((p: any) => {
                    const id = p.modelId || p.userModelId;
                    const model = modelMap.get(id);

                    return {
                        id,
                        name: model?.name || "Unknown",
                        code: model?.code || "unknown",
                        isCustom: model?.isCustom || false,
                        successCount: p._sum.successCount || 0,
                        tokenUsage: p._sum.tokenUsage || 0,
                    };
                }),

                topModels,
            },
        };
    }
}
