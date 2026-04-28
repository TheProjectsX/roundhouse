import { getMessageText } from "../../api-wrapper/normalize";
import type {
    NormalizedAssistantResponse,
    OpenAIChatMessage,
    ProviderCallParams,
    ProviderModelRecord,
} from "../types";
import { callModel, listModelsFromGemini } from "./model";
import type { GeminiPart, GeminiResponse, RequestPayload } from "./types";

const hasText = (part: GeminiPart): part is { text?: string } => {
    return "text" in part;
};

const hasFunctionCall = (
    part: GeminiPart,
): part is {
    functionCall?: { name?: string; args?: Record<string, unknown> };
} => {
    return "functionCall" in part;
};

const transformMessageToParts = (message: OpenAIChatMessage): GeminiPart[] => {
    if (message.role === "tool") {
        return [
            {
                functionResponse: {
                    name: message.name || message.tool_call_id || "tool",
                    response: {
                        content: getMessageText(message.content),
                    },
                },
            },
        ];
    }

    const parts: GeminiPart[] = [];
    const text = getMessageText(message.content);

    if (text) {
        parts.push({ text });
    }

    (message.tool_calls || []).forEach((toolCall) => {
        parts.push({
            functionCall: {
                name: toolCall.function.name,
                args: JSON.parse(toolCall.function.arguments || "{}"),
            },
        });
    });

    return parts.length > 0 ? parts : [{ text: " " }];
};

const transformPayload = (
    payload: ProviderCallParams["request"]["messages"],
): RequestPayload[] => {
    return payload
        .filter((item) => item.role !== "system" && item.role !== "developer")
        .map((item) => ({
            role: item.role === "assistant" ? "model" : "user",
            parts: transformMessageToParts(item),
        }));
};

const getSystemInstruction = (
    payload: ProviderCallParams["request"]["messages"],
) => {
    const value = payload
        .filter((item) => item.role === "system" || item.role === "developer")
        .map((item) => getMessageText(item.content))
        .filter(Boolean)
        .join("\n\n");

    return value || undefined;
};

const mapFinishReason = (finishReason?: string): string | null => {
    if (!finishReason) {
        return null;
    }

    if (finishReason === "MAX_TOKENS") {
        return "length";
    }

    if (
        finishReason === "STOP" ||
        finishReason === "FINISH_REASON_UNSPECIFIED"
    ) {
        return "stop";
    }

    if (finishReason === "MALFORMED_FUNCTION_CALL") {
        return "tool_calls";
    }

    return finishReason.toLowerCase();
};

const toOpenAIResponse = (
    data: GeminiResponse,
    requestedModel: string,
): NormalizedAssistantResponse => {
    const firstCandidate = data.candidates?.[0];
    const parts = firstCandidate?.content?.parts || [];
    const assistantContent = parts
        .map((part) => (hasText(part) ? (part.text ?? "") : ""))
        .filter(Boolean)
        .join("\n")
        .trim();

    const toolCalls = parts.reduce<
        Array<{
            id: string;
            type: "function";
            function: {
                name: string;
                arguments: string;
            };
        }>
    >((accumulator, part, index) => {
        if (!hasFunctionCall(part) || !part.functionCall?.name) {
            return accumulator;
        }

        accumulator.push({
            id: `call_${index}`,
            type: "function",
            function: {
                name: part.functionCall.name,
                arguments: JSON.stringify(part.functionCall.args || {}),
            },
        });

        return accumulator;
    }, []);

    const promptTokens = data.usageMetadata?.promptTokenCount;
    const completionTokens = data.usageMetadata?.candidatesTokenCount;
    const totalTokens = data.usageMetadata?.totalTokenCount;

    return {
        id: data.responseId || `gemini-${Date.now()}`,
        created: Math.floor(Date.now() / 1000),
        model: data.modelVersion || requestedModel,
        content: assistantContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        finishReason: mapFinishReason(firstCandidate?.finishReason),
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
        raw: data,
    };
};

export const callGeminiChatCompletion = async (
    params: ProviderCallParams,
): Promise<NormalizedAssistantResponse> => {
    const response = await callModel(
        params,
        transformPayload(params.request.messages),
        getSystemInstruction(params.request.messages),
    );

    if (response.error) {
        throw new Error(response.error.message || "Unknown error from Gemini");
    }

    return toOpenAIResponse(response, params.request.model);
};

export const listGeminiModels = async (
    params: ProviderCallParams,
): Promise<ProviderModelRecord[]> => {
    return listModelsFromGemini(params);
};
