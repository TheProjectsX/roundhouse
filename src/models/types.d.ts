export type ModelRequestPayload = {
    role: "user" | "system";
    content: string;
};

export type ModelRequestConfig = {
    temperature?: number;
    max_tokens?: number;
}