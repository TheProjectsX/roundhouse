import { RequestPayload } from "./types";

export const callModel = async (
    apiKey: string,
    model: string,
    payload: RequestPayload[],
    config?: {
        temperature?: number;
        maxOutputTokens?: number;
    },
) => {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
            method: "POST",
            headers: {
                "x-goog-api-key": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [...payload],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: config?.temperature ?? 0.7,
                    maxOutputTokens: config?.maxOutputTokens ?? 2048,
                },
            }),
        },
    );

    const data = await response.json();

    return data;
};
