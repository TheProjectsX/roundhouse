import type {
    NormalizedAssistantResponse,
    NormalizedRequest,
    OpenAIChatCompletionRequest,
    OpenAIChatMessage,
    OpenAICompatibleResponse,
    OpenAIModelListResponse,
    OpenAIResponseOutputItem,
    OpenAIResponsesRequest,
    OpenAIResponsesResponse,
    ProviderModelRecord,
} from "../models/types";

const REQUEST_RESERVED_KEYS = new Set([
    "model",
    "messages",
    "input",
    "tools",
    "tool_choice",
    "stream",
]);

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const asText = (content: OpenAIChatMessage["content"]): string => {
    if (typeof content === "string") {
        return content;
    }

    if (!Array.isArray(content)) {
        return "";
    }

    return content
        .map((part) => {
            if (!isRecord(part)) {
                return "";
            }

            if (typeof part.text === "string") {
                return part.text;
            }

            if (typeof part.input_text === "string") {
                return part.input_text;
            }

            if (typeof part.output_text === "string") {
                return part.output_text;
            }

            return "";
        })
        .filter(Boolean)
        .join("\n");
};

const toMessagesFromInput = (input: unknown): OpenAIChatMessage[] => {
    if (Array.isArray(input)) {
        return input.map((item) => {
            if (typeof item === "string") {
                return {
                    role: "user",
                    content: item,
                };
            }

            if (isRecord(item)) {
                if (
                    typeof item.role === "string" &&
                    [
                        "developer",
                        "system",
                        "user",
                        "assistant",
                        "tool",
                    ].includes(item.role)
                ) {
                    return item as OpenAIChatMessage;
                }

                if (typeof item.content === "string") {
                    return {
                        role: "user",
                        content: item.content,
                    };
                }
            }

            return {
                role: "user",
                content: JSON.stringify(item),
            };
        });
    }

    if (typeof input === "string") {
        return [
            {
                role: "user",
                content: input,
            },
        ];
    }

    if (isRecord(input) && typeof input.text === "string") {
        return [
            {
                role: "user",
                content: input.text,
            },
        ];
    }

    return [];
};

export const normalizeOpenAIRequest = (
    body: OpenAIChatCompletionRequest | OpenAIResponsesRequest,
): NormalizedRequest => {
    const rawBody = (isRecord(body) ? { ...body } : {}) as Record<
        string,
        unknown
    >;
    const model = typeof rawBody.model === "string" ? rawBody.model : "";

    if (!model) {
        throw new Error("`model` is required.");
    }

    const messages = Array.isArray(rawBody.messages)
        ? (rawBody.messages as OpenAIChatMessage[])
        : toMessagesFromInput(rawBody.input);

    if (messages.length === 0) {
        throw new Error(
            "`messages` or `input` must contain at least one item.",
        );
    }

    const params = Object.entries(rawBody).reduce<Record<string, unknown>>(
        (accumulator, [key, value]) => {
            if (!REQUEST_RESERVED_KEYS.has(key)) {
                accumulator[key] = value;
            }

            return accumulator;
        },
        {},
    );

    return {
        model,
        messages,
        tools: Array.isArray(rawBody.tools) ? rawBody.tools : undefined,
        tool_choice: rawBody.tool_choice as NormalizedRequest["tool_choice"],
        stream: Boolean(rawBody.stream),
        params,
        rawBody,
    };
};

export const toOpenAIChatCompletion = (
    response: NormalizedAssistantResponse,
): OpenAICompatibleResponse => {
    return {
        id: response.id,
        object: "chat.completion",
        created: response.created,
        model: response.model,
        choices: [
            {
                index: 0,
                message: {
                    role: "assistant",
                    content: response.content || null,
                    tool_calls: response.toolCalls,
                },
                finish_reason: response.finishReason,
            },
        ],
        usage: response.usage,
    };
};

export const toOpenAIResponseObject = (
    response: NormalizedAssistantResponse,
): OpenAIResponsesResponse => {
    const content: OpenAIResponseOutputItem["content"] = [];

    if (response.content) {
        content.push({
            type: "output_text",
            text: response.content,
            annotations: [],
        });
    }

    (response.toolCalls || []).forEach((toolCall) => {
        content.push({
            type: "tool_call",
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: toolCall.function.arguments,
        });
    });

    return {
        id: response.id,
        object: "response",
        created_at: response.created,
        model: response.model,
        output: [
            {
                id: `${response.id}_output_0`,
                type: "message",
                role: "assistant",
                status: "completed",
                content,
            },
        ],
        output_text: response.content,
        usage: response.usage,
    };
};

export const toOpenAIModelList = (
    models: ProviderModelRecord[],
    provider: string,
): OpenAIModelListResponse => {
    return {
        object: "list",
        data: models.map((model) => ({
            id: model.id,
            object: "model",
            created: model.created ?? Math.floor(Date.now() / 1000),
            owned_by: model.ownedBy ?? provider.toLowerCase(),
        })),
    };
};

export const toSseChunks = (
    response: NormalizedAssistantResponse,
): string[] => {
    const chunks: string[] = [];

    if (response.content) {
        chunks.push(
            `data: ${JSON.stringify({
                id: response.id,
                object: "chat.completion.chunk",
                created: response.created,
                model: response.model,
                choices: [
                    {
                        index: 0,
                        delta: {
                            role: "assistant",
                            content: response.content,
                        },
                        finish_reason: null,
                    },
                ],
            })}\n\n`,
        );
    }

    if (response.toolCalls?.length) {
        chunks.push(
            `data: ${JSON.stringify({
                id: response.id,
                object: "chat.completion.chunk",
                created: response.created,
                model: response.model,
                choices: [
                    {
                        index: 0,
                        delta: {
                            tool_calls: response.toolCalls,
                        },
                        finish_reason: null,
                    },
                ],
            })}\n\n`,
        );
    }

    chunks.push(
        `data: ${JSON.stringify({
            id: response.id,
            object: "chat.completion.chunk",
            created: response.created,
            model: response.model,
            choices: [
                {
                    index: 0,
                    delta: {},
                    finish_reason: response.finishReason,
                },
            ],
        })}\n\n`,
    );
    chunks.push("data: [DONE]\n\n");

    return chunks;
};

export const getMessageText = asText;
