import { Module } from "@nestjs/common";
import { AdminProvidersController } from "./providers/providers.controller";
import { AdminProvidersService } from "./providers/providers.service";
import { AdminUsersController } from "./users/users.controller";
import { AdminUsersService } from "./users/users.service";
import { AdminAuthController } from "./auth/auth.controller";
import { AdminAuthService } from "./auth/auth.service";
import { AdminAnalyticsController } from "./analytics/analytics.controller";
import { AdminAnalyticsService } from "./analytics/analytics.service";

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
