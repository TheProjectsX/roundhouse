import { ProviderCallParams, ProviderCallResult } from "../types";
import { callAnthropicModel } from "./model";

export const callAnthropic = async (
    params: ProviderCallParams,
): Promise<ProviderCallResult> => {
    try {
        const response = await callAnthropicModel(params);

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
