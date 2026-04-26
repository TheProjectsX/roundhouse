import type {
    NormalizedAssistantResponse,
    OpenAICompatibleResponse,
    ProviderCallParams,
    ProviderModelRecord,
} from "../types";

const normalizeBaseApi = (baseApi: string) => {
    return baseApi.endsWith("/") ? baseApi.slice(0, -1) : baseApi;
};

const toNormalizedResponse = (
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

export const callCustomChatCompletion = async (
    params: ProviderCallParams,
): Promise<NormalizedAssistantResponse> => {
    const baseApi = normalizeBaseApi(params.baseApi || "");
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (params.apiKey) {
        headers.Authorization = `Bearer ${params.apiKey}`;
    }

    const response = await fetch(baseApi, {
        method: "POST",
        headers,
        body: JSON.stringify({
            model: params.request.model,
            messages: params.request.messages,
            tools: params.request.tools,
            tool_choice: params.request.tool_choice,
            stream: params.request.stream,
            ...params.request.params,
        }),
    });

    const data = (await response.json()) as
        | OpenAICompatibleResponse
        | {
              error?: {
                  message?: string;
              };
          };

    if (!response.ok) {
        throw new Error(
            ("error" in data && data.error?.message) ||
                "Custom model API request failed",
        );
    }

    return toNormalizedResponse(
        data as OpenAICompatibleResponse,
        params.request.model,
    );
};

export const listCustomModels = async (
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
              error?: {
                  message?: string;
              };
          }
        | undefined;

    if (!response.ok) {
        throw new Error(data?.error?.message || "Failed to list custom models");
    }

    return (data?.data || []).map((model) => ({
        id: model.id,
        created: model.created,
        ownedBy: model.owned_by || "custom",
    }));
};
