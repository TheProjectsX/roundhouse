import type {
    NormalizedAssistantResponse,
    OpenAICompatibleResponse,
    ProviderCallParams,
    ProviderModelRecord,
} from "../types";

const normalizeBaseApi = (baseApi: string) => {
    return baseApi.endsWith("/") ? baseApi.slice(0, -1) : baseApi;
};

const buildRequestBody = (params: ProviderCallParams) => {
    const request = params.request;

    return {
        model: request.model,
        messages: request.messages,
        tools: request.tools,
        tool_choice: request.tool_choice,
        stream: false,
        ...request.params,
    };
};

const normalizeOpenAIResponse = (
    data: OpenAICompatibleResponse,
    requestedModel: string,
): NormalizedAssistantResponse => {
    const firstChoice = data.choices[0];

    return {
        id: data.id,
        created: data.created ?? Math.floor(Date.now() / 1000),
        model: data.model || requestedModel,
        content:
            typeof firstChoice?.message?.content === "string"
                ? firstChoice.message.content
                : "",
        toolCalls: firstChoice?.message?.tool_calls,
        finishReason: firstChoice?.finish_reason ?? null,
        usage: data.usage,
        raw: data,
    };
};

export const callOpenAIModel = async (
    params: ProviderCallParams,
): Promise<NormalizedAssistantResponse> => {
    const baseApi = normalizeBaseApi(params.baseApi || "");
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (params.apiKey) {
        headers.Authorization = `Bearer ${params.apiKey}`;
    }

    const response = await fetch(`${baseApi}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(buildRequestBody(params)),
    });

    const data = (await response.json()) as
        | OpenAICompatibleResponse
        | { error?: { message?: string } };

    if (!response.ok) {
        console.error("OpenAI API error response:", data);
        throw new Error(
            ("error" in data && data.error?.message) ||
                "OpenAI-compatible API request failed",
        );
    }

    return normalizeOpenAIResponse(
        data as OpenAICompatibleResponse,
        params.request.model,
    );
};

export const listModelsFromOpenAI = async (
    params: ProviderCallParams,
): Promise<ProviderModelRecord[]> => {
    const baseApi = normalizeBaseApi(params.baseApi || "");
    const headers: Record<string, string> = {};

    if (params.apiKey) {
        headers.Authorization = `Bearer ${params.apiKey}`;
    }

    const response = await fetch(`${baseApi}/models`, {
        method: "GET",
        headers,
    });

    const data = (await response.json()) as
        | {
              data?: Array<{
                  id: string;
                  created?: number;
                  owned_by?: string;
              }>;
              error?: { message?: string };
          }
        | undefined;

    if (!response.ok) {
        throw new Error(data?.error?.message || "Failed to list OpenAI models");
    }

    return (data?.data || []).map((model) => ({
        id: model.id,
        created: model.created,
        ownedBy: model.owned_by,
    }));
};
