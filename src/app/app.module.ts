import { AuthModule } from "@/modules/auth/auth.module";
import { OpenaiModule } from "@/modules/openai/openai.module";
import { ProfileModule } from "@/modules/profile/profile.module";
import { GlobalExceptionFilter } from "@/common/filters/global_exception";
import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AuthGuard } from "@/common/guards/auth.guard";
import { CommonModule } from "@/common/common.module";

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, "..", "..", "uploads"),
            serveRoot: "/uploads",
        }),
        ThrottlerModule.forRoot({
            throttlers: [
                {
                    name: "short",
                    ttl: 1000,
                    limit: 100,
                },
                {
                    name: "medium",
                    ttl: 10000,
                    limit: 1000,
                },
                {
                    name: "long",
                    ttl: 600000,
                    limit: 1000,
                },
            ],
        }),
        AuthModule,
        ProfileModule,
        OpenaiModule,
        CommonModule,
    ],
    controllers: [AppController],
    providers: [
        { provide: APP_FILTER, useClass: GlobalExceptionFilter },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: AuthGuard },
    ],
})
export class AppModule {}
