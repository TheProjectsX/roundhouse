export type ModelRequestPayload = {
    role: "user" | "system";
    content: string;
};

export type ModelRequestConfig = {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stop?: string[];
    enforce_json_output?: boolean;
    json_schema?: Record<string, unknown>;
    gemini_auth_mode?: "auto" | "api_key" | "bearer";
};

export type ModelProvider = "OPENAI" | "ANTHROPIC" | "GEMINI" | "CUSTOM";

export type ProviderCallParams = {
    baseApi: string;
    model: string;
    apiKey?: string;
    payload: ModelRequestPayload[];
    config?: ModelRequestConfig;
};

export type OpenAICompatibleChoice = {
    index: number;
    message: {
        role: "assistant";
        content: string;
    };
    finish_reason: string | null;
};

export type OpenAICompatibleUsage = {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
};

export type OpenAICompatibleResponse = {
    id: string;
    object: "chat.completion";
    created: number;
    model: string;
    choices: OpenAICompatibleChoice[];
    usage?: OpenAICompatibleUsage;
};

export type ProviderCallResult =
    | {
          success: true;
          data: OpenAICompatibleResponse;
      }
    | {
          success: false;
          error: string;
      };