import type {
    ModelProvider,
    OpenAIChatCompletionRequest,
    OpenAICompatibleResponse,
    OpenAIModelListResponse,
    OpenAIResponsesRequest,
    OpenAIResponsesResponse,
} from "@/core/models/types";
import {
    callProviderChatCompletion,
    listProviderModels,
} from "@/core/models";
import {
    normalizeOpenAIRequest,
    toOpenAIChatCompletion,
    toOpenAIModelList,
    toOpenAIResponseObject,
    toSseChunks,
} from "./normalize";

export type OpenAIWrapperContext = {
    provider?: ModelProvider;
    baseApi?: string;
    apiKey?: string;
    headers?: Record<string, string | string[] | undefined>;
};

const DEFAULT_BASE_APIS: Record<Exclude<ModelProvider, "CUSTOM">, string> = {
    OPENAI: "https://api.openai.com/v1",
    ANTHROPIC: "https://api.anthropic.com",
    GEMINI: "https://generativelanguage.googleapis.com/v1beta",
};

const normalizeHeaderValue = (
    value: string | string[] | undefined,
): string | undefined => {
    if (Array.isArray(value)) {
        return value[0];
    }

    return value;
};

const readAuthorizationBearer = (
    authorization: string | undefined,
): string | undefined => {
    if (!authorization) {
        return undefined;
    }

    return authorization.replace(/^Bearer\s+/i, "").trim() || undefined;
};

const resolveProviderFromModel = (model: string): ModelProvider => {
    const lower = model.toLowerCase();

    if (lower.startsWith("claude")) {
        return "ANTHROPIC";
    }

    if (lower.startsWith("gemini")) {
        return "GEMINI";
    }

    if (lower.startsWith("custom/")) {
        return "CUSTOM";
    }

    return "OPENAI";
};

const resolveProvider = (
    model: string,
    context: OpenAIWrapperContext,
): ModelProvider => {
    const providerHeader = normalizeHeaderValue(context.headers?.["x-provider"]);

    if (context.provider) {
        return context.provider;
    }

    if (providerHeader) {
        const upper = providerHeader.toUpperCase();

        if (
            upper === "OPENAI" ||
            upper === "ANTHROPIC" ||
            upper === "GEMINI" ||
            upper === "CUSTOM"
        ) {
            return upper;
        }
    }

    return resolveProviderFromModel(model);
};

const resolveBaseApi = (
    provider: ModelProvider,
    baseApi?: string,
): string => {
    if (baseApi) {
        return baseApi;
    }

    if (provider === "CUSTOM") {
        throw new Error("A custom provider requires `baseApi`.");
    }

    return DEFAULT_BASE_APIS[provider];
};

const buildProviderHeaders = (
    headers?: OpenAIWrapperContext["headers"],
): Record<string, string | undefined> => {
    if (!headers) {
        return {};
    }

    return Object.entries(headers).reduce<Record<string, string | undefined>>(
        (accumulator, [key, value]) => {
            accumulator[key.toLowerCase()] = normalizeHeaderValue(value);
            return accumulator;
        },
        {},
    );
};

const buildProviderContext = (
    body: OpenAIChatCompletionRequest | OpenAIResponsesRequest,
    context: OpenAIWrapperContext,
) => {
    const request = normalizeOpenAIRequest(body);
    const provider = resolveProvider(request.model, context);
    const headers = buildProviderHeaders(context.headers);
    const apiKey =
        context.apiKey || readAuthorizationBearer(headers.authorization);

    return {
        provider,
        request,
        params: {
            apiKey,
            baseApi: resolveBaseApi(provider, context.baseApi),
            headers,
            request,
        },
    };
};

export const createChatCompletion = async (
    body: OpenAIChatCompletionRequest,
    context: OpenAIWrapperContext = {},
): Promise<OpenAICompatibleResponse> => {
    const { provider, params } = buildProviderContext(body, context);
    const response = await callProviderChatCompletion(provider, params);

    return toOpenAIChatCompletion(response);
};

export const createChatCompletionStream = async (
    body: OpenAIChatCompletionRequest,
    context: OpenAIWrapperContext = {},
): Promise<string[]> => {
    const { provider, params } = buildProviderContext(body, context);
    const response = await callProviderChatCompletion(provider, params);

    return toSseChunks(response);
};

export const createResponse = async (
    body: OpenAIResponsesRequest,
    context: OpenAIWrapperContext = {},
): Promise<OpenAIResponsesResponse> => {
    const { provider, params } = buildProviderContext(body, context);
    const response = await callProviderChatCompletion(provider, params);

    return toOpenAIResponseObject(response);
};

export const listModels = async (
    context: OpenAIWrapperContext = {},
    fallbackModel = "gpt-4o-mini",
): Promise<OpenAIModelListResponse> => {
    const provider = resolveProvider(fallbackModel, context);
    const headers = buildProviderHeaders(context.headers);
    const apiKey =
        context.apiKey || readAuthorizationBearer(headers.authorization);
    const models = await listProviderModels(provider, {
        baseApi: resolveBaseApi(provider, context.baseApi),
        apiKey,
        headers,
        request: {
            model: fallbackModel,
            messages: [],
            stream: false,
            params: {},
            rawBody: {},
        },
    });

    return toOpenAIModelList(models, provider);
};
