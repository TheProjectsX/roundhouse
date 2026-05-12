export type ModelProvider = "OPENAI" | "ANTHROPIC" | "GEMINI" | "CUSTOM";

export type OpenAIMessageRole =
    | "developer"
    | "system"
    | "user"
    | "assistant"
    | "tool";

export type OpenAIChatTool = {
    type: "function";
    function: {
        name: string;
        description?: string;
        parameters?: Record<string, unknown>;
        strict?: boolean;
    };
};

export type OpenAIToolChoice =
    | "none"
    | "auto"
    | "required"
    | {
          type: "function";
          function: {
              name: string;
          };
      };

export type OpenAIChatToolCall = {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
    thought_signature?: string;
    extra_content?: {
        google?: {
            thought_signature?: string;
        };
    };
};

export type OpenAIChatMessage = {
    role: OpenAIMessageRole;
    content?: string | Array<Record<string, unknown>> | null;
    name?: string;
    tool_call_id?: string;
    tool_calls?: OpenAIChatToolCall[];
    refusal?: string | null;
    [key: string]: unknown;
};

export type OpenAIChatCompletionRequest = {
    model: string;
    messages: OpenAIChatMessage[];
    tools?: OpenAIChatTool[];
    tool_choice?: OpenAIToolChoice;
    stream?: boolean;
    [key: string]: unknown;
};

export type OpenAIResponsesRequest = {
    model: string;
    input?: unknown;
    messages?: OpenAIChatMessage[];
    tools?: OpenAIChatTool[];
    tool_choice?: OpenAIToolChoice;
    stream?: boolean;
    [key: string]: unknown;
};

export type NormalizedRequest = {
    model: string;
    messages: OpenAIChatMessage[];
    tools?: OpenAIChatTool[];
    tool_choice?: OpenAIToolChoice;
    stream: boolean;
    params: Record<string, unknown>;
    rawBody: Record<string, unknown>;
};

export type ProviderCallParams = {
    baseApi?: string;
    apiKey?: string;
    headers?: Record<string, string | undefined>;
    request: NormalizedRequest;
};

export type OpenAICompatibleChoice = {
    index: number;
    message: {
        role: "assistant";
        content: string | null;
        tool_calls?: OpenAIChatToolCall[];
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

export type OpenAIResponseOutputItem = {
    id: string;
    type: "message";
    role: "assistant";
    status: "completed";
    content: Array<
        | {
              type: "output_text";
              text: string;
              annotations: unknown[];
          }
        | {
              type: "tool_call";
              id: string;
              name: string;
              arguments: string;
          }
    >;
};

export type OpenAIResponsesResponse = {
    id: string;
    object: "response";
    created_at: number;
    model: string;
    output: OpenAIResponseOutputItem[];
    output_text: string;
    usage?: OpenAICompatibleUsage;
};

export type OpenAIModelListResponse = {
    object: "list";
    data: Array<{
        id: string;
        object: "model";
        created: number;
        owned_by: string;
    }>;
};

export type ProviderModelRecord = {
    id: string;
    created?: number;
    ownedBy?: string;
};

export type NormalizedAssistantResponse = {
    id: string;
    created: number;
    model: string;
    content: string;
    toolCalls?: OpenAIChatToolCall[];
    finishReason: string | null;
    usage?: OpenAICompatibleUsage;
    raw?: unknown;
};
