import { z } from "zod";

const openAIChatMessageSchema = z
    .object({
        role: z.enum(["developer", "system", "user", "assistant", "tool"]),
        content: z.any().optional(),
        name: z.string().optional(),
        tool_call_id: z.string().optional(),
        tool_calls: z.array(z.any()).optional(),
    })
    .passthrough();

export const chatCompletionBodySchema = z
    .object({
        model: z.string().min(1),
        messages: z.array(openAIChatMessageSchema).min(1),
        stream: z.boolean().optional(),
        tools: z.array(z.any()).optional(),
        tool_choice: z.any().optional(),
    })
    .passthrough();

export const responsesBodySchema = z
    .object({
        model: z.string().min(1),
        input: z.any().optional(),
        messages: z.array(openAIChatMessageSchema).optional(),
        stream: z.boolean().optional(),
        tools: z.array(z.any()).optional(),
        tool_choice: z.any().optional(),
    })
    .passthrough()
    .refine(
        (data) => {
            const hasInput = data.input !== undefined;
            const hasMessages =
                Array.isArray(data.messages) && data.messages.length > 0;

            return hasInput || hasMessages;
        },
        {
            message: "`input` or `messages` must be provided.",
            path: ["input"],
        },
    );

export const listModelsQuerySchema = z
    .object({
        apiKey: z.string().min(1).optional(),
    })
    .passthrough();
