import { callAnthropic } from "./anthropic";
import { callCustom } from "./custom";
import { callGemini } from "./gemini";
import { callOpenAI } from "./openai";
import {
    ModelProvider,
    ProviderCallParams,
    ProviderCallResult,
} from "./types";

const providerCallers: Record<
    ModelProvider,
    (params: ProviderCallParams) => Promise<ProviderCallResult>
> = {
    OPENAI: callOpenAI,
    ANTHROPIC: callAnthropic,
    GEMINI: callGemini,
    CUSTOM: callCustom,
};

export const callProviderModel = async (
    provider: ModelProvider,
    params: ProviderCallParams,
): Promise<ProviderCallResult> => {
    return providerCallers[provider](params);
};
