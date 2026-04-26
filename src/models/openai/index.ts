import { ProviderCallParams, ProviderCallResult } from "../types";
import { callOpenAIModel } from "./model";

export const callOpenAI = async (
    params: ProviderCallParams,
): Promise<ProviderCallResult> => {
    try {
        const response = await callOpenAIModel(params);

        return {
            success: true,
            data: response,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};
