import { z } from "zod";

export const completionBodySchema = z.object({
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
        })
        .optional(),
});
export type CompletionBodyInput = z.infer<typeof completionBodySchema>;
