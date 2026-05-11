export type OpenAIErrorPayload = {
    error: {
        message: string;
        type: string;
        param: string | null;
        code: string | null;
    };
};

export const toOpenAIError = (
    message: string,
    options?: {
        type?: string;
        param?: string | null;
        code?: string | null;
    },
): OpenAIErrorPayload => {
    return {
        error: {
            message,
            type: options?.type || "invalid_request_error",
            param: options?.param ?? null,
            code: options?.code ?? null,
        },
    };
};
