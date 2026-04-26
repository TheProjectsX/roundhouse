import {
    OpenAICompatibleChoice,
    OpenAICompatibleResponse,
    ProviderCallParams,
    ProviderCallResult,
} from "../types";
import { callModel } from "./model";
import { GeminiResponse, RequestPayload } from "./types";

const transformPayload = (payload: ProviderCallParams["payload"]): RequestPayload[] => {
    return payload.map((item) => ({
        role: item.role === "user" ? "user" : "model",
        parts: [{ text: item.content }],
    }));
};

const mapFinishReason = (finishReason?: string): string | null => {
    if (!finishReason) {
        return null;
    }

    if (finishReason === "MAX_TOKENS") {
        return "length";
    }

    if (finishReason === "STOP" || finishReason === "FINISH_REASON_UNSPECIFIED") {
        return "stop";
    }

    return finishReason.toLowerCase();
};

const toOpenAIResponse = (
    data: GeminiResponse,
    requestedModel: string,
): OpenAICompatibleResponse => {
    const firstCandidate = data.candidates?.[0];
    const assistantContent = firstCandidate?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("\n")
        .trim();

    const choice: OpenAICompatibleChoice = {
        index: 0,
        message: {
            role: "assistant",
            content: assistantContent || "",
        },
        finish_reason: mapFinishReason(firstCandidate?.finishReason),
    };

    const promptTokens = data.usageMetadata?.promptTokenCount;
    const completionTokens = data.usageMetadata?.candidatesTokenCount;
    const totalTokens = data.usageMetadata?.totalTokenCount;

    return {
        id: data.responseId || `gemini-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: data.modelVersion || requestedModel,
        choices: [choice],
        usage:
            promptTokens !== undefined &&
            completionTokens !== undefined &&
            totalTokens !== undefined
                ? {
                      prompt_tokens: promptTokens,
                      completion_tokens: completionTokens,
                      total_tokens: totalTokens,
                  }
                : undefined,
    };
};

export const callGemini = async (
    params: ProviderCallParams,
): Promise<ProviderCallResult> => {
    try {
        const response = await callModel(params, transformPayload(params.payload));

        if (response.error) {
            throw new Error(
                response.error.message || "Unknown error from Gemini API",
            );
        }

        return {
            success: true,
            data: toOpenAIResponse(response, params.model),
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};
