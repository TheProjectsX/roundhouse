import type {
    OpenAIChatMessage,
    OpenAIChatTool,
    OpenAIToolChoice,
} from "@/core/models/types";

export const OUTPUT_RESERVE_CAP = 2000;
export const CONTEXT_WINDOW_SAFETY_FACTOR = 1.25;

const extractTextLength = (content: OpenAIChatMessage["content"]): number => {
    if (typeof content === "string") {
        return content.length;
    }

    if (!Array.isArray(content)) {
        return 0;
    }

    let total = 0;
    for (const part of content) {
        if (!part || typeof part !== "object") {
            continue;
        }
        const record = part as Record<string, unknown>;
        if (typeof record.text === "string") {
            total += record.text.length;
        } else if (typeof record.input_text === "string") {
            total += record.input_text.length;
        } else if (typeof record.output_text === "string") {
            total += record.output_text.length;
        }
    }

    return total;
};

export const estimateRequestTokens = (
    messages: OpenAIChatMessage[] | undefined,
    tools?: OpenAIChatTool[],
    requestedMaxTokens?: number | null,
): number => {
    let charCount = 0;

    if (Array.isArray(messages)) {
        for (const msg of messages) {
            charCount += extractTextLength(msg.content);
            if (Array.isArray(msg.tool_calls)) {
                charCount += JSON.stringify(msg.tool_calls).length;
            }
            charCount += 16; // role & framing overhead
        }
    }

    if (Array.isArray(tools) && tools.length > 0) {
        charCount += JSON.stringify(tools).length;
    }

    const inputTokens = Math.max(1, Math.ceil(charCount / 4));
    const outputReserve =
        typeof requestedMaxTokens === "number" &&
        Number.isFinite(requestedMaxTokens) &&
        requestedMaxTokens > 0
            ? Math.min(requestedMaxTokens, OUTPUT_RESERVE_CAP)
            : 0;

    return inputTokens + outputReserve;
};

export const requestHasImages = (
    messages: OpenAIChatMessage[] | undefined,
): boolean => {
    if (!Array.isArray(messages)) {
        return false;
    }

    for (const msg of messages) {
        if (!Array.isArray(msg.content)) {
            continue;
        }

        for (const part of msg.content) {
            if (!part || typeof part !== "object") {
                continue;
            }
            const type = (part as { type?: unknown }).type;
            if (
                type === "image_url" ||
                type === "input_image" ||
                type === "image"
            ) {
                return true;
            }
        }
    }

    return false;
};

export const requestRequiresTools = (
    tools: OpenAIChatTool[] | undefined,
    toolChoice?: OpenAIToolChoice,
): boolean => {
    return Array.isArray(tools) && tools.length > 0 && toolChoice !== "none";
};

export const fitsContextWindowStrict = (
    contextWindow: number | null | undefined,
    estimatedTokens: number,
): boolean => {
    if (contextWindow == null || contextWindow <= 0) {
        return true;
    }

    return estimatedTokens <= contextWindow;
};

export const fitsContextWindowWithMargin = (
    contextWindow: number | null | undefined,
    estimatedTokens: number,
): boolean => {
    if (contextWindow == null || contextWindow <= 0) {
        return true;
    }

    return (
        Math.ceil(estimatedTokens * CONTEXT_WINDOW_SAFETY_FACTOR) <=
        contextWindow
    );
};
