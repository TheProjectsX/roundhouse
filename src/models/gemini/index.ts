import { ModelRequestConfig, ModelRequestPayload } from "../types";
import { callModel } from "./model";
import { RequestPayload } from "./types";

const transformPayload = (payload: ModelRequestPayload[]): RequestPayload[] => {
    return payload.map((item) => ({
        role: item.role === "user" ? "user" : "model",
        parts: [{ text: item.content }],
    }));
};

export const callGemini = async (
    apiKey: string,
    model: string,
    payload: ModelRequestPayload[],
    config?: ModelRequestConfig,
) => {
    try {
        const response = await callModel(
            apiKey,
            model,
            transformPayload(payload),
            config,
        );
        if (response.error) {
            throw new Error(
                response.error.message || "Unknown error from Gemini API",
            );
        }

        return {
            success: true,
            data: response,
        };
    } catch (error) {
        console.error("Error calling Gemini model:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};
