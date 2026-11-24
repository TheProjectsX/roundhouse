import { Controller, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { IsPublic } from "@/common/decorators/auth.decorator";
import { AnthropicService } from "./anthropic.service";

@ApiTags("Anthropic")
@IsPublic()
@Controller("v1")
export class AnthropicController {
    constructor(private readonly anthropicService: AnthropicService) {}

    @Post("messages")
    async messages(@Req() req: Request, @Res() res: Response) {
        const result = await this.anthropicService.messages(req);

        if ("stream" in result && result.stream) {
            res.status(result.statusCode);
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("X-Accel-Buffering", "no");
            res.flushHeaders();
            for (const event of result.events) {
                if (res.writableEnded) {
                    break;
                }
                res.write(event);
            }
            return res.end();
        }

        return res.status(result.statusCode).json(result.body);
    }

    @Post("messages/count_tokens")
    countTokens(@Req() req: Request, @Res() res: Response) {
        const result = this.anthropicService.countTokens(req);
        return res.status(result.statusCode).json(result.body);
    }
}
