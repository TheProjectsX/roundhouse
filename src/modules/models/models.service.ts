import { Request, Response } from "express";
import { z } from "zod";
import {
    completionBodySchema,
    type CompletionBodyInput,
} from "@modules/models/models.validation";
import { createChatCompletion } from "@/core/api-wrapper/service";

type CompletionBody = z.infer<typeof completionBodySchema>;

export const completion = async (
    req: Request<Record<string, never>, unknown, CompletionBody>,
    res: Response,
) => {
    const body: CompletionBodyInput = req.body;
    const { provider, baseApi, model, messages, config } = body;
    const response = await createChatCompletion(
        {
            model,
            messages,
            ...(config || {}),
        },
        {
            provider,
            baseApi,
            headers: req.headers,
        },
    );

    return res.json(response);
};
