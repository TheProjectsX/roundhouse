import { z } from "zod";

export const completionBodySchema = z.object({
    provider: z.enum(["OPENAI", "ANTHROPIC", "GEMINI", "CUSTOM"]),
    baseApi: z.string().url(),
    model: z.string().min(1),
    messages: z.array(
        z.object({
            role: z.enum(["user", "system"]),
            content: z.string().min(1),
        }),
    ),
    config: z
        .object({
            temperature: z.number().min(0).max(2).optional(),
            max_tokens: z.number().int().positive().optional(),
            top_p: z.number().min(0).max(1).optional(),
            stop: z.array(z.string().min(1)).optional(),
            enforce_json_output: z.boolean().optional(),
            json_schema: z.record(z.string(), z.unknown()).optional(),
            gemini_auth_mode: z
                .enum(["auto", "api_key", "bearer"])
                .optional(),
        })
        .optional(),
});
export type CompletionBodyInput = z.infer<typeof completionBodySchema>;
