export type GeminiPart =
    | { text?: string }
    | {
          functionCall?: {
              name?: string;
              args?: Record<string, unknown>;
              thought_signature?: string;
          };
      }
    | {
          functionResponse?: {
              name?: string;
              response?: Record<string, unknown>;
          };
      };

export type RequestPayload = {
    role: "user" | "model";
    parts: GeminiPart[];
};

export type GeminiResponse = {
    responseId?: string;
    modelVersion?: string;
    candidates?: Array<{
        content?: {
            parts?: GeminiPart[];
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
