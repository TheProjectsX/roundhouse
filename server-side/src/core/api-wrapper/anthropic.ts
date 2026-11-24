import type {
    OpenAIChatCompletionRequest,
    OpenAIChatMessage,
    OpenAIChatTool,
    OpenAICompatibleResponse,
    OpenAIToolChoice,
} from "@/core/models/types";

export type AnthropicContentBlock =
    | { type: "text"; text: string }
    | {
          type: "image";
          source:
              | { type: "base64"; media_type: string; data: string }
              | { type: "url"; url: string };
      }
    | {
          type: "tool_use";
          id: string;
          name: string;
          input: Record<string, unknown>;
      }
    | {
          type: "tool_result";
          tool_use_id: string;
          content?: string | Array<{ type: "text"; text: string }>;
      };

export type AnthropicMessageInput = {
    role: "user" | "assistant";
    content: string | AnthropicContentBlock[];
};

export type AnthropicToolInput = {
    name: string;
    description?: string;
    input_schema: Record<string, unknown>;
};

export type AnthropicMessagesRequest = {
    model?: string;
    max_tokens?: number;
    system?: string | Array<{ type: "text"; text: string }>;
    messages: AnthropicMessageInput[];
    tools?: AnthropicToolInput[];
    tool_choice?:
        | { type: "auto" }
        | { type: "any" }
        | { type: "none" }
        | { type: "tool"; name: string };
    temperature?: number;
    top_p?: number;
    stop_sequences?: string[];
    stream?: boolean;
};

const extractAnthropicText = (
    content: string | Array<{ type: "text"; text: string }> | undefined,
): string => {
    if (typeof content === "string") {
        return content;
    }
    if (!Array.isArray(content)) {
        return "";
    }
    return content
        .filter((part) => part?.type === "text" && typeof part.text === "string")
        .map((part) => part.text)
        .join("\n");
};

const mapAnthropicToolChoice = (
    toolChoice: AnthropicMessagesRequest["tool_choice"],
): OpenAIToolChoice | undefined => {
    if (!toolChoice) {
        return undefined;
    }
    if (toolChoice.type === "auto") return "auto";
    if (toolChoice.type === "any") return "required";
    if (toolChoice.type === "none") return "none";
    if (toolChoice.type === "tool") {
        return {
            type: "function",
            function: { name: toolChoice.name },
        };
    }
    return undefined;
};

export const toOpenAIChatRequest = (
    body: AnthropicMessagesRequest,
): OpenAIChatCompletionRequest => {
    const messages: OpenAIChatMessage[] = [];

    const systemText = extractAnthropicText(body.system);
    if (systemText) {
        messages.push({ role: "system", content: systemText });
    }

    for (const msg of body.messages) {
        if (typeof msg.content === "string") {
            messages.push({ role: msg.role, content: msg.content });
            continue;
        }

        if (!Array.isArray(msg.content)) {
            continue;
        }

        if (msg.role === "assistant") {
            const textParts: string[] = [];
            const toolCalls: NonNullable<OpenAIChatMessage["tool_calls"]> = [];

            for (const block of msg.content) {
                if (block.type === "text") {
                    textParts.push(block.text);
                } else if (block.type === "tool_use") {
                    toolCalls.push({
                        id: block.id,
                        type: "function",
                        function: {
                            name: block.name,
                            arguments: JSON.stringify(block.input ?? {}),
                        },
                    });
                }
            }

            messages.push({
                role: "assistant",
                content: textParts.join("\n") || null,
                ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
            });
            continue;
        }

        const userParts: Array<Record<string, unknown>> = [];
        const toolResults: OpenAIChatMessage[] = [];

        for (const block of msg.content) {
            if (block.type === "text") {
                userParts.push({ type: "text", text: block.text });
            } else if (block.type === "image") {
                const url =
                    block.source.type === "base64"
                        ? `data:${block.source.media_type};base64,${block.source.data}`
                        : block.source.url;
                userParts.push({ type: "image_url", image_url: { url } });
            } else if (block.type === "tool_result") {
                toolResults.push({
                    role: "tool",
                    tool_call_id: block.tool_use_id,
                    content: extractAnthropicText(block.content),
                });
            }
        }

        for (const toolMsg of toolResults) {
            messages.push(toolMsg);
        }

        if (userParts.length > 0) {
            const isTextOnly = userParts.every((p) => p.type === "text");
            messages.push({
                role: "user",
                content: isTextOnly
                    ? userParts.map((p) => String(p.text)).join("\n")
                    : userParts,
            });
        }
    }

    const tools: OpenAIChatTool[] | undefined = body.tools?.map((tool) => ({
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.input_schema,
        },
    }));

    return {
        model: body.model || "auto",
        messages,
        ...(tools?.length ? { tools } : {}),
        ...(body.tool_choice
            ? { tool_choice: mapAnthropicToolChoice(body.tool_choice) }
            : {}),
        ...(body.max_tokens !== undefined
            ? { max_tokens: body.max_tokens }
            : {}),
        ...(body.temperature !== undefined
            ? { temperature: body.temperature }
            : {}),
        ...(body.top_p !== undefined ? { top_p: body.top_p } : {}),
        ...(body.stop_sequences?.length ? { stop: body.stop_sequences } : {}),
        stream: Boolean(body.stream),
    };
};

const mapStopReason = (
    finishReason: string | null | undefined,
    hasToolCalls: boolean,
): "end_turn" | "max_tokens" | "tool_use" => {
    if (hasToolCalls || finishReason === "tool_calls") {
        return "tool_use";
    }
    if (finishReason === "length") {
        return "max_tokens";
    }
    return "end_turn";
};

const safeParseJsonObject = (raw: string): Record<string, unknown> => {
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : { raw };
    } catch {
        return { raw };
    }
};

export const toAnthropicMessageResponse = (
    response: OpenAICompatibleResponse,
    requestedModel?: string,
) => {
    const choice = response.choices[0];
    const text = choice?.message?.content ?? "";
    const toolCalls = choice?.message?.tool_calls ?? [];

    const content: Array<
        | { type: "text"; text: string }
        | {
              type: "tool_use";
              id: string;
              name: string;
              input: Record<string, unknown>;
          }
    > = [];

    if (text) {
        content.push({ type: "text", text });
    }

    for (const tc of toolCalls) {
        content.push({
            type: "tool_use",
            id: tc.id,
            name: tc.function.name,
            input: safeParseJsonObject(tc.function.arguments),
        });
    }

    return {
        id: response.id || `msg_${Date.now()}`,
        type: "message" as const,
        role: "assistant" as const,
        model: requestedModel || response.model,
        content,
        stop_reason: mapStopReason(choice?.finish_reason, toolCalls.length > 0),
        stop_sequence: null,
        usage: {
            input_tokens: response.usage?.prompt_tokens ?? 0,
            output_tokens: response.usage?.completion_tokens ?? 0,
        },
    };
};

const sseEvent = (event: string, data: unknown): string =>
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

export const toAnthropicSseEvents = (
    response: OpenAICompatibleResponse,
    requestedModel?: string,
): string[] => {
    const msg = toAnthropicMessageResponse(response, requestedModel);
    const events: string[] = [];

    events.push(
        sseEvent("message_start", {
            type: "message_start",
            message: {
                id: msg.id,
                type: "message",
                role: "assistant",
                model: msg.model,
                content: [],
                stop_reason: null,
                stop_sequence: null,
                usage: {
                    input_tokens: msg.usage.input_tokens,
                    output_tokens: 0,
                },
            },
        }),
    );

    msg.content.forEach((block, index) => {
        if (block.type === "text") {
            events.push(
                sseEvent("content_block_start", {
                    type: "content_block_start",
                    index,
                    content_block: { type: "text", text: "" },
                }),
            );
            events.push(
                sseEvent("content_block_delta", {
                    type: "content_block_delta",
                    index,
                    delta: { type: "text_delta", text: block.text },
                }),
            );
            events.push(
                sseEvent("content_block_stop", {
                    type: "content_block_stop",
                    index,
                }),
            );
        } else {
            events.push(
                sseEvent("content_block_start", {
                    type: "content_block_start",
                    index,
                    content_block: {
                        type: "tool_use",
                        id: block.id,
                        name: block.name,
                        input: {},
                    },
                }),
            );
            events.push(
                sseEvent("content_block_delta", {
                    type: "content_block_delta",
                    index,
                    delta: {
                        type: "input_json_delta",
                        partial_json: JSON.stringify(block.input),
                    },
                }),
            );
            events.push(
                sseEvent("content_block_stop", {
                    type: "content_block_stop",
                    index,
                }),
            );
        }
    });

    events.push(
        sseEvent("message_delta", {
            type: "message_delta",
            delta: {
                stop_reason: msg.stop_reason,
                stop_sequence: null,
            },
            usage: {
                output_tokens: msg.usage.output_tokens,
            },
        }),
    );
    events.push(sseEvent("message_stop", { type: "message_stop" }));

    return events;
};

export const toAnthropicError = (type: string, message: string) => ({
    type: "error" as const,
    error: {
        type,
        message,
    },
});
