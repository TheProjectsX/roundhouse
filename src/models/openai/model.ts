import {
    ModelRequestConfig,
    OpenAICompatibleResponse,
    ProviderCallParams,
} from "../types";

type OpenAIRequestMessage = {
    role: "system" | "user";
    content: string;
};

type OpenAIRequestBody = {
    model: string;
    messages: OpenAIRequestMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stop?: string[];
    stream?: boolean;
};

const normalizeBaseApi = (baseApi: string) => {
    return baseApi.endsWith("/") ? baseApi.slice(0, -1) : baseApi;
};

const buildRequestBody = (
    params: ProviderCallParams,
): OpenAIRequestBody => {
    const requestConfig: ModelRequestConfig = params.config ?? {};

    return {
        model: params.model,
        messages: params.payload.map((item) => ({
            role: item.role,
            content: item.content,
        })),
        temperature: requestConfig.temperature,
        max_tokens: requestConfig.max_tokens,
        top_p: requestConfig.top_p,
        stop: requestConfig.stop,
        stream: false,
    };
};

export const callOpenAIModel = async (
    params: ProviderCallParams,
): Promise<OpenAICompatibleResponse> => {
    const baseApi = normalizeBaseApi(params.baseApi);

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

    const data = await response.json();

    if (!response.ok) {
        const message =
            data?.error?.message || "OpenAI-compatible API request failed";
        throw new Error(message);
    }

    return data as OpenAICompatibleResponse;
};
