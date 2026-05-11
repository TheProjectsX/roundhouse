import type {
    NormalizedAssistantResponse,
    ProviderCallParams,
    ProviderModelRecord,
} from "../types";
import { callOpenAIModel, listModelsFromOpenAI } from "./model";

export const callOpenAIChatCompletion = async (
    params: ProviderCallParams,
): Promise<NormalizedAssistantResponse> => {
    return callOpenAIModel(params);
};

export const listOpenAIModels = async (
    params: ProviderCallParams,
): Promise<ProviderModelRecord[]> => {
    return listModelsFromOpenAI(params);
};
