import type { ProviderCallParams, ProviderModelRecord } from "../types";
import type { GeminiResponse, RequestPayload } from "./types";

const normalizeBaseApi = (baseApi: string) => {
    return baseApi.endsWith("/") ? baseApi.slice(0, -1) : baseApi;
};

const buildGenerationConfig = (params: ProviderCallParams) => {
    const generationConfig: Record<string, unknown> = {};
    const requestParams = params.request.params;

    if (requestParams.temperature !== undefined) {
        generationConfig.temperature = requestParams.temperature;
    }

    if (requestParams.max_tokens !== undefined) {
        generationConfig.maxOutputTokens = requestParams.max_tokens;
    }

    if (requestParams.top_p !== undefined) {
        generationConfig.topP = requestParams.top_p;
    }

    if (requestParams.stop !== undefined) {
        generationConfig.stopSequences = requestParams.stop;
    }

    if (requestParams.response_format !== undefined) {
        generationConfig.responseMimeType = requestParams.response_format;
    }

    return generationConfig;
};

const buildToolConfig = (params: ProviderCallParams) => {
    if (!params.request.tools?.length) {
        return undefined;
    }

    if (params.request.tool_choice === "none") {
        return {
            functionCallingConfig: {
                mode: "NONE",
            },
        };
    }

    if (params.request.tool_choice === "required") {
        return {
            functionCallingConfig: {
                mode: "ANY",
            },
        };
    }

    if (
        params.request.tool_choice &&
        typeof params.request.tool_choice === "object"
    ) {
        return {
            functionCallingConfig: {
                mode: "ANY",
                allowedFunctionNames: [
                    params.request.tool_choice.function.name,
                ],
            },
        };
    }

    return {
        functionCallingConfig: {
            mode: "AUTO",
        },
    };
};

export const callModel = async (
    params: ProviderCallParams,
    payload: RequestPayload[],
    systemInstruction?: string,
): Promise<GeminiResponse> => {
    const baseApi = normalizeBaseApi(params.baseApi || "");
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (params.apiKey) {
        headers["x-goog-api-key"] = params.apiKey;
    }

    const response = await fetch(
        `${baseApi}/models/${params.request.model}:generateContent`,
        {
            method: "POST",
            headers,
            body: JSON.stringify({
                contents: payload,
                tools: params.request.tools?.length
                    ? [
                          {
                              functionDeclarations: params.request.tools.map(
                                  (tool) => ({
                                      name: tool.function.name,
                                      description: tool.function.description,
                                      parameters: tool.function.parameters || {
                                          type: "object",
                                          properties: {},
                                      },
                                  }),
                              ),
                          },
                      ]
                    : undefined,
                toolConfig: buildToolConfig(params),
                generationConfig: buildGenerationConfig(params),
                systemInstruction: systemInstruction
                    ? {
                          parts: [{ text: systemInstruction }],
                      }
                    : undefined,
            }),
        },
    );

    const data = (await response.json()) as GeminiResponse;

    if (!response.ok) {
        throw new Error(data.error?.message || "Gemini API request failed");
    }

    return data;
};

export const listModelsFromGemini = async (
    params: ProviderCallParams,
): Promise<ProviderModelRecord[]> => {
    const baseApi = normalizeBaseApi(params.baseApi || "");
    const headers: Record<string, string> = {};

    if (params.apiKey) {
        headers["x-goog-api-key"] = params.apiKey;
    }

    const response = await fetch(`${baseApi}/models`, {
        method: "GET",
        headers,
    });

    const data = (await response.json()) as
        | {
              models?: Array<{
                  name: string;
              }>;
              error?: {
                  message?: string;
              };
          }
        | undefined;

    if (!response.ok) {
        throw new Error(data?.error?.message || "Failed to list Gemini models");
    }

    return (data?.models || []).map((model) => ({
        id: model.name.replace(/^models\//, ""),
        ownedBy: "google",
    }));
};
