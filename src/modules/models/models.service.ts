import { Request, Response } from "express";
import { z } from "zod";
import {
    completionBodySchema,
    type CompletionBodyInput,
} from "@modules/models/models.validation";
import { callGemini } from "@/models/gemini";

type CompletionBody = z.infer<typeof completionBodySchema>;

export const completion = async (
    req: Request<Record<string, never>, unknown, CompletionBody>,
    res: Response,
) => {
    const headers = req.headers;
    const auth = headers.authorization || "";
    const apiKey = auth.replace("Bearer ", "");

    const body: CompletionBodyInput = req.body;

    const {
        model,
        messages,
        config = { temperature: 0.7, max_tokens: 250 },
    } = body;

    const response = await callGemini(apiKey, model, messages, {
        temperature: config.temperature,
        max_tokens: config.max_tokens,
    });

    return res.json(response);
};
