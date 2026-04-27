const { NestFactory } = require("@nestjs/core");
const { DocumentBuilder, SwaggerModule } = require("@nestjs/swagger");
const { AppModule } = require("../dist/app/app.module");
const fs = require("fs");

async function generateSwagger() {
    const app = await NestFactory.create(AppModule);

    const config = new DocumentBuilder()
        .setTitle("NestJS Starter Pack")
        .setDescription("The API Description for NestJS Backend Starter Pack")
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

    const document = SwaggerModule.createDocument(app, config);
    document.security = [{ accessToken: [] }];

    // Remove the auto generate "Response" from requests
    for (const path of Object.values(document.paths)) {
        for (const method of Object.values(path as any)) {
            if (!(method as any).responses) continue;

            (method as any).responses = {};
        }
    }

    fs.writeFileSync("./swagger-spec.json", JSON.stringify(document, null, 2));

    await app.close();
}

generateSwagger();
