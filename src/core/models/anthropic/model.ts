import { getMessageText } from "../../api-wrapper/normalize";
import type {
    NormalizedAssistantResponse,
    OpenAIChatMessage,
    OpenAIToolChoice,
    ProviderCallParams,
    ProviderModelRecord,
} from "../types";

type AnthropicRequestMessage = {
    role: "user" | "assistant";
    content: Array<Record<string, unknown>>;
};

type AnthropicContentBlock = {
    type: string;
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
};

type AnthropicUsage = {
    input_tokens: number;
    output_tokens: number;
};

type AnthropicMessageResponse = {
    id: string;
    type: "message";
    role: "assistant";
    model: string;
    content: AnthropicContentBlock[];
    stop_reason: string | null;
    usage?: AnthropicUsage;
    error?: {
        message?: string;
    };
};

const normalizeBaseApi = (baseApi: string) => {
    return baseApi.endsWith("/") ? baseApi.slice(0, -1) : baseApi;
};

const mapStopReason = (stopReason: string | null): string | null => {
    if (!stopReason) {
        return null;
    }

    if (stopReason === "max_tokens") {
        return "length";
    }

    if (stopReason === "tool_use") {
        return "tool_calls";
    }

    if (stopReason === "end_turn" || stopReason === "stop_sequence") {
        return "stop";
    }

    return stopReason;
};

const buildAnthropicContent = (
    message: OpenAIChatMessage,
): Array<Record<string, unknown>> => {
    if (message.role === "tool") {
        return [
            {
                type: "tool_result",
                tool_use_id: message.tool_call_id,
                content: getMessageText(message.content),
            },
        ];
    }

    const content: Array<Record<string, unknown>> = [];
    const text = getMessageText(message.content);

    if (text) {
        content.push({
            type: "text",
            text,
        });
    }

    (message.tool_calls || []).forEach((toolCall) => {
        content.push({
            type: "tool_use",
            id: toolCall.id,
            name: toolCall.function.name,
            input: JSON.parse(toolCall.function.arguments || "{}"),
        });
    });

    return content.length > 0 ? content : [{ type: "text", text: " " }];
};

const buildAnthropicMessages = (
    messages: OpenAIChatMessage[],
): AnthropicRequestMessage[] => {
    return messages
        .filter(
            (message) =>
                message.role !== "system" && message.role !== "developer",
        )
        .map((message) => ({
            role:
                message.role === "assistant"
                    ? "assistant"
                    : ("user" as const),
            content: buildAnthropicContent(message),
        }));
};

const buildSystemPrompt = (messages: OpenAIChatMessage[]) => {
    const systemPrompts = messages
        .filter(
            (message) =>
                message.role === "system" || message.role === "developer",
        )
        .map((message) => getMessageText(message.content).trim())
        .filter(Boolean);

    return systemPrompts.length > 0 ? systemPrompts.join("\n\n") : undefined;
};

const mapToolChoice = (toolChoice: OpenAIToolChoice | undefined) => {
    if (!toolChoice || toolChoice === "auto") {
        return { type: "auto" };
    }

    if (toolChoice === "required") {
        return { type: "any" };
    }

    if (toolChoice === "none") {
        return undefined;
    }

    return {
        type: "tool",
        name: toolChoice.function.name,
    };
};

const toAnthropicTools = (
    tools: ProviderCallParams["request"]["tools"],
): Array<Record<string, unknown>> | undefined => {
    if (!tools?.length) {
        return undefined;
    }

    return tools.map((tool) => ({
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters || {
            type: "object",
            properties: {},
        },
    }));
};

const toNormalizedResponse = (
    response: AnthropicMessageResponse,
    requestedModel: string,
): NormalizedAssistantResponse => {
    const content = response.content
        .filter((part) => part.type === "text")
        .map((part) => part.text ?? "")
        .join("\n")
        .trim();

    const toolCalls = response.content
        .filter((part) => part.type === "tool_use" && part.name)
        .map((part, index) => ({
            id: part.id || `tool_${index}`,
            type: "function" as const,
            function: {
                name: part.name || "unknown_tool",
                arguments: JSON.stringify(part.input || {}),
            },
        }));

    const promptTokens = response.usage?.input_tokens;
    const completionTokens = response.usage?.output_tokens;

    return {
        id: response.id,
        created: Math.floor(Date.now() / 1000),
        model: response.model || requestedModel,
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        finishReason: mapStopReason(response.stop_reason),
        usage:
            promptTokens !== undefined && completionTokens !== undefined
                ? {
                      prompt_tokens: promptTokens,
                      completion_tokens: completionTokens,
                      total_tokens: promptTokens + completionTokens,
                  }
                : undefined,
        raw: response,
    };
};

export const callAnthropicModel = async (
    params: ProviderCallParams,
): Promise<NormalizedAssistantResponse> => {
    const baseApi = normalizeBaseApi(params.baseApi || "");
    const headers: Record<string, string> = {
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    };

    if (params.apiKey) {
        headers["x-api-key"] = params.apiKey;
    }

    const response = await fetch(`${baseApi}/v1/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            model: params.request.model,
            max_tokens:
                (params.request.params.max_tokens as number | undefined) ?? 1024,
            system: buildSystemPrompt(params.request.messages),
            messages: buildAnthropicMessages(params.request.messages),
            tools: toAnthropicTools(params.request.tools),
            tool_choice: mapToolChoice(params.request.tool_choice),
            stream: false,
            ...params.request.params,
        }),
    });

    const data = (await response.json()) as AnthropicMessageResponse;

    if (!response.ok) {
        throw new Error(data.error?.message || "Anthropic API request failed");
    }

    return toNormalizedResponse(data, params.request.model);
};

export const listModelsFromAnthropic = async (
    params: ProviderCallParams,
): Promise<ProviderModelRecord[]> => {
    const baseApi = normalizeBaseApi(params.baseApi || "");
    const headers: Record<string, string> = {
        "anthropic-version": "2023-06-01",
    };

    if (params.apiKey) {
        headers["x-api-key"] = params.apiKey;
    }

    const response = await fetch(`${baseApi}/v1/models`, {
        method: "GET",
        headers,
    });

    const data = (await response.json()) as
        | {
              data?: Array<{
                  id: string;
                  created_at?: string;
              }>;
              error?: {
                  message?: string;
              };
          }
        | undefined;

    if (!response.ok) {
        throw new Error(
            data?.error?.message || "Failed to list Anthropic models",
        );
    }

    return (data?.data || []).map((model) => ({
        id: model.id,
        created: model.created_at
            ? Math.floor(new Date(model.created_at).getTime() / 1000)
            : undefined,
        ownedBy: "anthropic",
    }));
};
