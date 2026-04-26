import type {
    NormalizedAssistantResponse,
    ProviderCallParams,
    ProviderModelRecord,
} from "../types";
import {
    callAnthropicModel,
    listModelsFromAnthropic,
} from "./model";

export const callAnthropicChatCompletion = async (
    params: ProviderCallParams,
): Promise<NormalizedAssistantResponse> => {
    return callAnthropicModel(params);
};

export const listAnthropicModels = async (
    params: ProviderCallParams,
): Promise<ProviderModelRecord[]> => {
    return listModelsFromAnthropic(params);
};
