import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/common/services/prisma/prisma.service";

@Injectable()
export class AdminAnalyticsService {
    constructor(private prisma: PrismaService) {}

    async fetchAdminAnalytics() {
        const [
            users,
            apiKeys,
            globalProviders,
            customProviders,
            models,
            userModels,
            providerSelections,
            modelSelections,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.apiKey.count(),
            this.prisma.provider.count(),
            this.prisma.userProvider.count(),
            this.prisma.model.count(),
            this.prisma.userModel.count(),
            this.prisma.providerSelection.count(),
            this.prisma.modelSelection.count(),
        ]);

        return {
            message: "Analytics fetched",
            data: {
                users,
                apiKeys,
                globalProviders,
                customProviders,
                models,
                userModels,
                providerSelections,
                modelSelections,
            },
        };
    }
}
