import { ProviderCallParams } from "../types";
import { RequestPayload, GeminiResponse } from "./types";

const normalizeBaseApi = (baseApi: string) => {
    return baseApi.endsWith("/") ? baseApi.slice(0, -1) : baseApi;
};

const buildGenerationConfig = (params: ProviderCallParams) => {
    const generationConfig: Record<string, unknown> = {
        temperature: params.config?.temperature ?? 0.7,
        maxOutputTokens: params.config?.max_tokens ?? 2048,
    };

    if (params.config?.enforce_json_output) {
        generationConfig.responseMimeType = "application/json";
    }

    if (params.config?.json_schema) {
        generationConfig.responseSchema = params.config.json_schema;
    }

    return generationConfig;
};

export const callModel = async (
    params: ProviderCallParams,
    payload: RequestPayload[],
): Promise<GeminiResponse> => {
    const baseApi = normalizeBaseApi(params.baseApi);
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (params.apiKey) {
        headers["x-goog-api-key"] = params.apiKey
    }


    const response = await fetch(
        `${baseApi}/models/${params.model}:generateContent`,
        {
            method: "POST",
            headers,
            body: JSON.stringify({
                contents: [...payload],
                generationConfig: buildGenerationConfig(params),
            }),
        },
    );

    const data = (await response.json()) as GeminiResponse;

    if (!response.ok) {
        throw new Error(data.error?.message || "Gemini API request failed");
    }

    return data;
};
