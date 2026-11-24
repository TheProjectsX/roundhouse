import { Module } from "@nestjs/common";
import { ProvidersModule } from "@/modules/iv1/providers/providers.module";
import { AdminProvidersController } from "./modules/providers/providers.controller";
import { AdminProvidersService } from "./modules/providers/providers.service";
import { AdminUsersController } from "./modules/users/users.controller";
import { AdminUsersService } from "./modules/users/users.service";
import { AdminAuthController } from "./modules/auth/auth.controller";
import { AdminAuthService } from "./modules/auth/auth.service";
import { AdminAnalyticsController } from "./modules/analytics/analytics.controller";
import { AdminAnalyticsService } from "./modules/analytics/analytics.service";
import { AdminController } from "./admin.controller";

@Module({
    imports: [ProvidersModule],
    controllers: [
        AdminController,
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
