import { callAnthropicChatCompletion, listAnthropicModels } from "./anthropic";
import { callCustomChatCompletion, listCustomModels } from "./custom";
import { callGeminiChatCompletion, listGeminiModels } from "./gemini";
import { callOpenAIChatCompletion, listOpenAIModels } from "./openai";
import type {
    ModelProvider,
    NormalizedAssistantResponse,
    ProviderCallParams,
    ProviderModelRecord,
} from "./types";

const providerChatCallers: Record<
    ModelProvider,
    (params: ProviderCallParams) => Promise<NormalizedAssistantResponse>
> = {
    OPENAI: callOpenAIChatCompletion,
    ANTHROPIC: callAnthropicChatCompletion,
    GEMINI: callGeminiChatCompletion,
    CUSTOM: callCustomChatCompletion,
};

const providerModelListers: Record<
    ModelProvider,
    (params: ProviderCallParams) => Promise<ProviderModelRecord[]>
> = {
    OPENAI: listOpenAIModels,
    ANTHROPIC: listAnthropicModels,
    GEMINI: listGeminiModels,
    CUSTOM: listCustomModels,
};

export const callProviderChatCompletion = async (
    provider: ModelProvider,
    params: ProviderCallParams,
): Promise<NormalizedAssistantResponse> => {
    return providerChatCallers[provider](params);
};

export const listProviderModels = async (
    provider: ModelProvider,
    params: ProviderCallParams,
): Promise<ProviderModelRecord[]> => {
    return providerModelListers[provider](params);
};
