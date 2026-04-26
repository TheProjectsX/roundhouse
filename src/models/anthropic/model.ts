import {
    OpenAICompatibleResponse,
    ProviderCallParams,
    OpenAICompatibleChoice,
} from "../types";

type AnthropicContentBlock = {
    type: string;
    text?: string;
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
};

type AnthropicRequestMessage = {
    role: "user";
    content: string;
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

    if (stopReason === "end_turn" || stopReason === "stop_sequence") {
        return "stop";
    }

    return stopReason;
};

const buildAnthropicMessages = (
    payload: ProviderCallParams["payload"],
): AnthropicRequestMessage[] => {
    const messages = payload
        .filter((item) => item.role === "user")
        .map((item) => ({
            role: "user" as const,
            content: item.content,
        }));

    if (messages.length > 0) {
        return messages;
    }

    return [{ role: "user", content: " " }];
};

const buildSystemPrompt = (payload: ProviderCallParams["payload"]) => {
    const systemPrompts = payload
        .filter((item) => item.role === "system")
        .map((item) => item.content.trim())
        .filter(Boolean);

    return systemPrompts.length > 0 ? systemPrompts.join("\n\n") : undefined;
};

const toOpenAIResponse = (
    response: AnthropicMessageResponse,
    requestedModel: string,
): OpenAICompatibleResponse => {
    const assistantText = response.content
        .filter((part) => part.type === "text")
        .map((part) => part.text ?? "")
        .join("\n")
        .trim();

    const choice: OpenAICompatibleChoice = {
        index: 0,
        message: {
            role: "assistant",
            content: assistantText,
        },
        finish_reason: mapStopReason(response.stop_reason),
    };

    const promptTokens = response.usage?.input_tokens;
    const completionTokens = response.usage?.output_tokens;

    return {
        id: response.id,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: response.model || requestedModel,
        choices: [choice],
        usage:
            promptTokens !== undefined && completionTokens !== undefined
                ? {
                      prompt_tokens: promptTokens,
                      completion_tokens: completionTokens,
                      total_tokens: promptTokens + completionTokens,
                  }
                : undefined,
    };
};

export const callAnthropicModel = async (
    params: ProviderCallParams,
): Promise<OpenAICompatibleResponse> => {
    const baseApi = normalizeBaseApi(params.baseApi);

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
            model: params.model,
            max_tokens: params.config?.max_tokens ?? 1024,
            temperature: params.config?.temperature,
            top_p: params.config?.top_p,
            stop_sequences: params.config?.stop,
            system: buildSystemPrompt(params.payload),
            messages: buildAnthropicMessages(params.payload),
        }),
    });

    const data = (await response.json()) as
        | AnthropicMessageResponse
        | { error?: { message?: string } };

    if (!response.ok) {
        const message =
            ("error" in data && data.error?.message) ||
            "Anthropic API request failed";
        throw new Error(message);
    }

    return toOpenAIResponse(data as AnthropicMessageResponse, params.model);
};
