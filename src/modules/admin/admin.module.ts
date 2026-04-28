import { Module } from "@nestjs/common";
import { AdminProvidersController } from "./providers/admin-providers.controller";
import { AdminProvidersService } from "./providers/admin-providers.service";
import { AdminUsersController } from "./users/admin-users.controller";
import { AdminUsersService } from "./users/admin-users.service";
import { AdminAuthController } from "./auth/admin-auth.controller";
import { AdminAuthService } from "./auth/admin-auth.service";
import { AdminAnalyticsController } from "./analytics/admin-analytics.controller";
import { AdminAnalyticsService } from "./analytics/admin-analytics.service";

@Module({
    controllers: [
        AdminProvidersController,
        AdminUsersController,
        AdminAuthController,
        AdminAnalyticsController,
    ],
    providers: [
        AdminProvidersService,
        AdminUsersService,
        AdminAuthService,
        AdminAnalyticsService,
    ],
})
export class AdminModule {}
