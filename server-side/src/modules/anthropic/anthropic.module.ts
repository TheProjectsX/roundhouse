import { Module } from "@nestjs/common";
import { AnthropicController } from "./anthropic.controller";
import { AnthropicService } from "./anthropic.service";

@Module({
    controllers: [AnthropicController],
    providers: [AnthropicService],
})
export class AnthropicModule {}
