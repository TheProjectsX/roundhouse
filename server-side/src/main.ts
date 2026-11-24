import "tsconfig-paths/register";
import { ConsoleLogger, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "@/app/app.module";
import type { Request, Response } from "express";
import config from "./config";

import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { getLocalIP } from "./common/utils/localIp";

function getAllowedOrigins(): string[] {
    const defaults = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://roundhouse-api.vercel.app",
    ];
    const extra = [
        config.url.frontend,
        ...(config.cors?.origins ? config.cors.origins.split(",") : []),
    ]
        .filter((origin): origin is string => Boolean(origin && origin.trim()))
        .map((origin) => origin.trim().replace(/\/+$/, ""));

    return Array.from(new Set([...defaults, ...extra]));
}

export async function createApp(): Promise<NestExpressApplication> {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: new ConsoleLogger({
            prefix: "roundhouse",
            logLevels: ["error", "warn", "fatal"],
            timestamp: true,
            json: true,
        }),
        rawBody: true,
    });

    // --- Middlewares & Config ---
    app.use(cookieParser());
    app.useBodyParser("json", {
        limit: "10mb",
    });
    app.useBodyParser("urlencoded", {
        limit: "10mb",
        extended: true,
    });

    // --- CORS ---
    const allowedOrigins = getAllowedOrigins();
    const vercelPreviewPattern =
        /^https:\/\/roundhouse-api(-[a-z0-9-]+)?\.vercel\.app$/;

    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }
            const normalized = origin.replace(/\/+$/, "");
            if (
                allowedOrigins.includes(normalized) ||
                vercelPreviewPattern.test(normalized)
            ) {
                return callback(null, true);
            }
            return callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Accept",
            "Origin",
            "X-Requested-With",
            "Access-Control-Allow-Origin",
        ],
    });

    // --- Health Check ---
    const nativeApp = app.getHttpAdapter().getInstance();
    nativeApp.get("/", (req: Request, res: Response) => {
        res.send({
            success: true,
            message: "Roundhouse Backend is running!",
            server_name: "roundhouse-backend",
            server_type: "WEB",
        });
    });

    // --- Global Pipes ---
    app.useGlobalPipes(
        new ValidationPipe({
            disableErrorMessages: false,
            whitelist: true,
            forbidNonWhitelisted: false,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    // --- Swagger Doc - Dev server only ---
    if (config.env !== "production") {
        const swaggerConfig = new DocumentBuilder()
            .setTitle("Roundhouse Backend")
            .setDescription(
                "The API Description for Roundhouse Backend - A platform for managing AI providers and API keys.",
            )
            .setVersion("1.0")
            .addBearerAuth(
                {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    name: "Authorization",
                    description: "Enter JWT token",
                    in: "header",
                },
                "accessToken",
            )
            .build();

        const document = SwaggerModule.createDocument(app, swaggerConfig);
        document.security = [{ accessToken: [] }];
        SwaggerModule.setup("api/v1", app, document);
    }

    await app.init();
    return app;
}

async function bootstrap() {
    const app = await createApp();

    // --- Server Listen ---
    const port = Number(config.port) || 5000;
    await app.listen(port, "0.0.0.0");

    console.log(`\n🚀 Application is running on:`);
    console.log(`📡 Local:    http://localhost:${port}`);
    console.log(`🌐 Network:  http://${getLocalIP()}:${port}`);
    if (config.env !== "production")
        console.log(`📚 Swagger:  http://localhost:${port}/api/v1`);

    return app;
}

bootstrap();
