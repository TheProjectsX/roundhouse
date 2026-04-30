import { Controller, Get, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { OpenaiService } from "./openai.service";
import { IsPublic } from "@/common/decorators/auth.decorator";

@ApiTags("OpenAI")
@IsPublic()
@Controller("v1")
export class OpenaiController {
    constructor(private readonly openaiService: OpenaiService) {}

    @Post("chat/completions")
    async chatCompletions(@Req() req: Request, @Res() res: Response) {
        const result = await this.openaiService.chatCompletions(req);

        if ("stream" in result && result.stream) {
            res.status(result.statusCode);
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.flushHeaders();
            res.write(result.chunks.join(""));
            return res.end();
        }

        return res.status(result.statusCode).json(result.body);
    }

    @Post("responses")
    async responses(@Req() req: Request, @Res() res: Response) {
        const result = await this.openaiService.responses(req);
        return res.status(result.statusCode).json(result.body);
    }

    @Get("models")
    async models(@Req() req: Request, @Res() res: Response) {
        const result = await this.openaiService.models(req);
        return res.status(result.statusCode).json(result.body);
    }
}
