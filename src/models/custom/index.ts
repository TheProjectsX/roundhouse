import {
    OpenAICompatibleResponse,
    ProviderCallParams,
    ProviderCallResult,
} from "../types";

const normalizeBaseApi = (baseApi: string) => {
    return baseApi.endsWith("/") ? baseApi.slice(0, -1) : baseApi;
};

export const callCustom = async (
    params: ProviderCallParams,
): Promise<ProviderCallResult> => {
    try {
        const baseApi = normalizeBaseApi(params.baseApi);

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (params.apiKey) {
            headers.Authorization = `Bearer ${params.apiKey}`;
        }

        // Boilerplate custom caller: expects an OpenAI-compatible JSON response.
        const response = await fetch(baseApi, {
            method: "POST",
            headers,
            body: JSON.stringify({
                model: params.model,
                messages: params.payload,
                config: params.config,
            }),
        });

        const data = (await response.json()) as OpenAICompatibleResponse;

        if (!response.ok) {
            throw new Error("Custom model API request failed");
        }

        return {
            success: true,
            data,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};
