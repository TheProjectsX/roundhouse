/* eslint-disable @typescript-eslint/no-require-imports */

const { NestFactory } = require("@nestjs/core");
const { DocumentBuilder, SwaggerModule } = require("@nestjs/swagger");
const { AppModule } = require("../dist/app/app.module");
const fs = require("fs");

async function generateSwagger() {
    // 1. Create the Nest application instance
    const app = await NestFactory.create(AppModule);

    // 2. Build the Swagger Configuration
    const config = new DocumentBuilder()
        .setTitle("Roundhouse Backend")
        .setDescription(
            "The API Description for Roundhouse Backend - A platform for managing AI providers and API keys.",
        )
        .setVersion("1.0")
        // We define the security scheme here.
        // The second argument 'accessToken' is the ID used to reference this scheme.
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

    const document = SwaggerModule.createDocument(app, config);

    if (document.paths) {
        Object.values(document.paths).forEach((path) => {
            Object.values(path).forEach((operation) => {
                // This forces Postman to look for a security scheme named 'accessToken'
                operation.security = [{ accessToken: [] }];

                // Keep your existing responses logic
                if (operation.responses) {
                    operation.responses = {};
                }
            });
        });
    }

    // Ensure the security scheme itself is named exactly 'accessToken' in components
    // (The DocumentBuilder usually does this, but we're being explicit)
    if (document.components && document.components.securitySchemes) {
        const scheme = document.components.securitySchemes["accessToken"];
        if (scheme) {
            // Postman looks for this description to help map variables
            scheme.description = "JWT Access Token";
        }
    }

    fs.writeFileSync("./swagger-spec.json", JSON.stringify(document, null, 2));
    console.log(
        "✅ Swagger spec generated successfully at ./swagger-spec.json",
    );

    await app.close();
}

generateSwagger().catch((err) => {
    console.error("❌ Failed to generate swagger spec:", err);
    process.exit(1);
});
