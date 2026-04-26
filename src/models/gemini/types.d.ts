export type RequestPayload = {
    role: "user" | "model";
    parts: Record<"text", string>[];
};

export type GeminiResponse = {
    responseId?: string;
    modelVersion?: string;
    candidates?: Array<{
        content?: {
            parts?: Array<{ text?: string }>;
        };
        finishReason?: string;
    }>;
    usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
    };
    error?: {
        message?: string;
    };
};
