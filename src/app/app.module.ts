import { AuthModule } from "@/modules/iv1/auth/auth.module";
import { OpenaiModule } from "@/modules/openai/openai.module";
import { MeModule } from "@/modules/iv1/me/me.module";
import { ProvidersModule } from "@/modules/iv1/providers/providers.module";
import { ApikeysModule } from "@/modules/iv1/apikeys/apikeys.module";
import { ModelsModule } from "@/modules/iv1/models/models.module";
import { AdminModule } from "@/modules/iv1/admin/admin.module";
import { GlobalExceptionFilter } from "@/common/filters/global_exception";
import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, RouterModule } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AuthGuard } from "@/common/guards/auth.guard";
import { CommonModule } from "@/common/common.module";
import { RequestLoggingMiddleware } from "@/middlewares/request-logging.middleware";

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
        MeModule,
        OpenaiModule,
        ProvidersModule,
        ApikeysModule,
        ModelsModule,
        AdminModule,
        CommonModule,
        RouterModule.register([
            {
                path: "api",
                children: [
                    {
                        path: "iv1",
                        children: [
                            {
                                path: "auth",
                                module: AuthModule,
                            },
                            {
                                path: "me",
                                module: MeModule,
                            },
                            {
                                path: "admin",
                                module: AdminModule,
                            },
                            {
                                path: "providers",
                                module: ProvidersModule,
                            },
                            {
                                path: "apikeys",
                                module: ApikeysModule,
                            },
                            {
                                path: "models",
                                module: ModelsModule,
                            },
                        ],
                    },
                ],
            },
        ]),
    ],
    controllers: [AppController],
    providers: [
        { provide: APP_FILTER, useClass: GlobalExceptionFilter },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: AuthGuard },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestLoggingMiddleware).forRoutes("*");
    }
}
